"use client"

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import {
    useFrappeCreateDoc,
    useFrappePostCall
} from "frappe-react-sdk";
import { frappeBrowser } from "@/lib/frappe";
import { useToast } from "@/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Alert,
    AlertDescription,
    AlertTitle
} from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    UploadCloud,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Download,
    FileText,
    RefreshCw,
    ChartNoAxesColumnDecreasing
} from "lucide-react";

interface ColumnDefinition {
    fieldname: string;
    label: string;
    required: boolean;
}

const DOCTYPE_COLUMNS: Record<string, ColumnDefinition[]> = {
    "DBT Claims": [
        { fieldname: "invoice_number", label: "Invoice Number", required: true },
        { fieldname: "purchase_date", label: "Purchase Date", required: true },
        { fieldname: "quantity", label: "Quantity", required: true },
        { fieldname: "total_amount", label: "Total Amount", required: true },
        { fieldname: "component", label: "Component ", required: true },
        { fieldname: "app_form", label: "App Form", required: true },
        { fieldname: "type_of_animal", label: "Type Of Animal", required: true },
        { fieldname: "number_of_animals_benefitted", label: "Number of animals benefitted", required: false },
        { fieldname: "land_covered", label: "Land Covered", required: false },
    ]
};

type UploadState =
    | "Idle"
    | "Selected"
    | "Validating"
    | "Uploading File"
    | "Creating Import Job"
    | "Processing"
    | "Complete"
    | "Failed";

interface LogEntry {
    row: number;
    success: boolean;
    messages: string[];
}

export default function BulkFileUpload({
    defaultDocType = "DBT Claims"
}: {
    defaultDocType?: string;
}) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States
    const [selectedDocType, setSelectedDocType] = useState<string>(defaultDocType);
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [currentState, setCurrentState] = useState<UploadState>("Idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [missingColumns, setMissingColumns] = useState<string[]>([]);
    const [dataImportId, setDataImportId] = useState<string | null>(null);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [jobStatus, setJobStatus] = useState<string | null>(null);
    const [importLogs, setImportLogs] = useState<LogEntry[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [successRows, setSuccessRows] = useState<number>(0);

    // SDK Hooks
    const { call: uploadCustomFile, loading: customUploadLoading } = useFrappePostCall(
        "vmddp_app.api.api.file_upload"
    );
    const { createDoc, loading: createLoading } = useFrappeCreateDoc();
    const { call: triggerBackgroundImport, loading: triggerLoading } = useFrappePostCall(
        "frappe.core.doctype.data_import.data_import.form_start_import"
    );
    const { call: getImportLogsApi } = useFrappePostCall(
        "frappe.core.doctype.data_import.data_import.get_import_logs"
    );

    // Reset all state when DocType or File changes
    const resetStates = (clearFile = true) => {
        if (clearFile) {
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
        setCurrentState("Idle");
        setErrorMessage(null);
        setMissingColumns([]);
        setDataImportId(null);
        setProgressPercent(0);
        setJobStatus(null);
        setImportLogs([]);
        setTotalRows(0);
        setSuccessRows(0);
    };

    const handleDocTypeChange = (value: string) => {
        setSelectedDocType(value);
        resetStates(true);
    };

    // Setup drag events
    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            processSelectedFile(droppedFile);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processSelectedFile(e.target.files[0]);
        }
    };

    // Pre-upload structural check
    const processSelectedFile = (selectedFile: File) => {
        resetStates(false);
        setFile(selectedFile);

        // Check file extension
        const extension = selectedFile.name.split(".").pop()?.toLowerCase();
        if (!extension || !["csv", "xls", "xlsx"].includes(extension)) {
            setCurrentState("Failed");
            setErrorMessage("Unsupported file type. Please upload a .csv, .xls, or .xlsx file.");
            toast({
                title: "Invalid File Type",
                description: "Only CSV and Excel spreadsheets are allowed.",
                variant: "destructive"
            });
            return;
        }

        // Limit size to 10MB to avoid large-payload DoS
        if (selectedFile.size > 10 * 1024 * 1024) {
            setCurrentState("Failed");
            setErrorMessage("File exceeds the maximum size limit of 10MB.");
            toast({
                title: "File Too Large",
                description: "Please reduce the file size to less than 10MB.",
                variant: "destructive"
            });
            return;
        }

        setCurrentState("Selected");
    };

    // Phase 1: Client-Side Structural Check
    const validateFileHeaders = async (selectedFile: File): Promise<boolean> => {
        setCurrentState("Validating");
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Read first row for headers
                    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
                    if (rows.length === 0) {
                        setCurrentState("Failed");
                        setErrorMessage("The uploaded file is empty.");
                        resolve(false);
                        return;
                    }

                    const headers = rows[0].map((h: any) => String(h).trim().toLowerCase());
                    const configColumns = DOCTYPE_COLUMNS[selectedDocType] || [];
                    const requiredConfigs = configColumns.filter((col) => col.required);
                    const missing: string[] = [];

                    // Check headers
                    requiredConfigs.forEach((col) => {
                        const targetFieldLower = col.fieldname.toLowerCase();
                        const targetLabelLower = col.label.toLowerCase();
                        const targetLabelSpaceLower = targetLabelLower.replace(/_/g, " ");

                        const found = headers.some(
                            (h: string) =>
                                h === targetFieldLower ||
                                h === targetLabelLower ||
                                h === targetLabelSpaceLower ||
                                h.includes(targetFieldLower) ||
                                h.includes(targetLabelSpaceLower)
                        );

                        if (!found) {
                            missing.push(col.label);
                        }
                    });

                    if (missing.length > 0) {
                        setCurrentState("Failed");
                        setMissingColumns(missing);
                        setErrorMessage(
                            `Structure mismatch. Missing required headers: ${missing.join(", ")}`
                        );
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                } catch (error) {
                    console.error("Local parsing error:", error);
                    setCurrentState("Failed");
                    setErrorMessage("Unable to parse the document. Please verify the spreadsheet is not corrupted.");
                    resolve(false);
                }
            };

            reader.onerror = (e) => {
                console.error("FileReader error event:", e);
                setCurrentState("Failed");
                const fileError = reader.error;
                if (fileError && fileError.name === "NotReadableError") {
                    setErrorMessage(
                        "The file could not be read (NotReadableError). " +
                        "This typically happens if the file is open and locked by another application (such as Excel or LibreOffice), " +
                        "or if browser sandbox permissions for this file have expired. " +
                        "Please close any applications using this file, or try copying it to your home directory/desktop and re-selecting it."
                    );
                } else {
                    setErrorMessage("Failed to read file contents. Please ensure the file is readable and not corrupted.");
                }
                resolve(false);
            };

            reader.readAsArrayBuffer(selectedFile);
        });
    };

    // Execute upload and import pipeline
    const handleStartImport = async () => {
        if (!file) return;

        // 1. Client-Side Structural Check
        const isValid = await validateFileHeaders(file);
        if (!isValid) return;

        try {
            // 2. Phase 2: Upload File to Frappe using custom API
            setCurrentState("Uploading File");
            setProgressPercent(20);

            // Convert file to base64
            const fileData = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64 = result.split(",")[1];
                    resolve(base64);
                };
                reader.onerror = (err) => reject(err);
            });

            const uploadResponse = await uploadCustomFile({
                file: fileData,
                file_data: fileData,
                filedata: fileData,
                filename: file.name,
                file_name: file.name
            });

            const result = uploadResponse?.message || uploadResponse;

            if (result && (result.status === 500 || result.status === "500" || result.error)) {
                throw new Error(result.error || result.message || "Custom file upload API failed.");
            }

            const uploadedFileUrl = result.file_url || result.data?.file_url || result.url;
            if (!uploadedFileUrl) {
                throw new Error("File uploaded successfully but custom API returned no file URL.");
            }

            // 3. Phase 3: Create Data Import Document
            setCurrentState("Creating Import Job");
            setProgressPercent(40);
            const dataImportDoc = await createDoc("Data Import", {
                reference_doctype: selectedDocType,
                import_file: uploadedFileUrl,
                import_type: "Insert New Records",
                submit_after_import: 0
            });

            const dataImportName = dataImportDoc.name;
            setDataImportId(dataImportName);

            // 4. Phase 4: Fire Background Processing Worker
            setCurrentState("Processing");
            setProgressPercent(60);
            await triggerBackgroundImport({ data_import: dataImportName });

            // 5. Phase 5: Start Polling & Status Tracking
            startPolling(dataImportName);

        } catch (error: any) {
            console.error("Import pipeline failure:", error);
            setCurrentState("Failed");
            setErrorMessage(error.message || "An unexpected error occurred during execution.");
            toast({
                title: "Import Failed",
                description: error.message || "Operation failed. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Phase 5 Polling
    const startPolling = (importName: string) => {
        let intervalId: NodeJS.Timeout;
        const POLL_INTERVAL = 3000; // Poll every 3 seconds

        const checkStatus = async () => {
            try {
                // Fetch document details via standard JS SDK client
                const doc = await frappeBrowser.db().getDoc("Data Import", importName);
                if (!doc) return;

                const status = doc.status;
                setJobStatus(status);

                // Update progress percentages based on status
                if (status === "Pending") {
                    setProgressPercent(70);
                } else if (status === "In Progress") {
                    setProgressPercent(85);
                } else if (["Success", "Partial Success", "Failed"].includes(status)) {
                    clearInterval(intervalId);
                    setProgressPercent(100);
                    setCurrentState("Complete");

                    // Parse Logs
                    let logs: LogEntry[] = [];
                    try {
                        const logsResponse = await getImportLogsApi({ data_import: importName });
                        const rawLogs = logsResponse?.message || logsResponse || [];

                        if (Array.isArray(rawLogs)) {
                            logs = rawLogs.map((item: any) => {
                                let parsedMessages: string[] = [];
                                if (item.messages) {
                                    try {
                                        const parsed = typeof item.messages === "string"
                                            ? JSON.parse(item.messages)
                                            : item.messages;
                                        if (Array.isArray(parsed)) {
                                            parsedMessages = parsed.map((m: any) => {
                                                if (m && typeof m === "object") {
                                                    if (m.message) {
                                                        return m.title ? `[${m.title}] ${m.message}` : m.message;
                                                    }
                                                    return JSON.stringify(m);
                                                }
                                                return String(m);
                                            });
                                        } else if (parsed && typeof parsed === "object") {
                                            if (parsed.message) {
                                                parsedMessages = [parsed.title ? `[${parsed.title}] ${parsed.message}` : parsed.message];
                                            } else {
                                                parsedMessages = [JSON.stringify(parsed)];
                                            }
                                        } else if (typeof parsed === "string") {
                                            parsedMessages = [parsed];
                                        }
                                    } catch (e) {
                                        parsedMessages = [String(item.messages)];
                                    }
                                }
                                if (item.exception) {
                                    parsedMessages.push(`Exception: ${item.exception}`);
                                }
                                if (parsedMessages.length === 0) {
                                    parsedMessages = [item.success ? "Row imported successfully" : "No error context provided"];
                                }

                                let rowNum = 0;
                                if (item.row_indexes) {
                                    try {
                                        const parsedIdx = typeof item.row_indexes === "string"
                                            ? JSON.parse(item.row_indexes)
                                            : item.row_indexes;
                                        if (Array.isArray(parsedIdx) && parsedIdx.length > 0) {
                                            rowNum = parsedIdx[0];
                                        } else if (typeof parsedIdx === "number") {
                                            rowNum = parsedIdx;
                                        }
                                    } catch (e) {
                                        console.error("Error parsing row_indexes:", e);
                                    }
                                }

                                return {
                                    row: rowNum,
                                    success: !!item.success,
                                    messages: parsedMessages
                                };
                            });
                            logs.sort((a, b) => a.row - b.row);
                        }
                    } catch (e) {
                        console.error("Error fetching or parsing import logs:", e);
                    }

                    setImportLogs(logs);
                    // Compute statistics
                    const total = logs.length;
                    const success = logs.filter((l) => l.success).length;
                    setTotalRows(total);
                    setSuccessRows(success);

                    // Toast result
                    if (status === "Success") {
                        toast({
                            title: "Import Success",
                            description: `All ${success} records successfully imported.`,
                        });
                    } else if (status === "Partial Success") {
                        toast({
                            title: "Partial Success",
                            description: `${success} of ${total} records imported. Review errors below.`,
                            variant: "default"
                        });
                    } else {
                        setCurrentState("Failed");
                        setErrorMessage(doc.error_log || "Frappe failed to process the import job. Check errors below.");
                        toast({
                            title: "Import Failed",
                            description: "The background task failed. Review errors below.",
                            variant: "destructive"
                        });
                    }
                }
            } catch (err: any) {
                console.error("Polling error:", err);
                // We don't immediately stop polling for a network glitch to ensure resilience
            }
        };

        // Fire immediately then on interval
        checkStatus();
        intervalId = setInterval(checkStatus, POLL_INTERVAL);

        // Return cleanup helper
        return () => clearInterval(intervalId);
    };

    // Download Sample Template Exporter
    const handleDownloadTemplate = () => {
        const configColumns = DOCTYPE_COLUMNS[selectedDocType] || [];

        // Build columns using labels
        const headers = configColumns.map((col) => col.label);
        const sampleRow: Record<string, any> = {};

        // Populate sample data
        if (selectedDocType === "DBT Claims") {
            sampleRow["Invoice Number"] = "INV-2026-0001";
            sampleRow["Purchase Date"] = "2026-05-20";
            sampleRow["Quantity"] = 50.0;
            sampleRow["Total Amount"] = 15000.00;
            sampleRow["Component "] = "Fodder Seed";
            sampleRow["App Form"] = "APP-000123";
            sampleRow["Type Of Animal"] = "Cow";
            sampleRow["Number of animals benefitted"] = 5;
            sampleRow["Land Covered"] = 1.5;
        } else {
            configColumns.forEach((col) => {
                sampleRow[col.label] = `Sample ${col.label}`;
            });
        }

        // Export via XLSX
        const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        const filename = `${selectedDocType.replace(/\s+/g, "_")}_Template.xlsx`;
        XLSX.writeFile(workbook, filename);

        toast({
            title: "Template Downloaded",
            description: `Starter template exported successfully as ${filename}.`
        });
    };

    return (
        <div className="space-y-6">
            <Card className="border-2 border-primary/20 shadow-lg backdrop-blur-sm bg-gradient-to-br from-card to-background/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="text-xl font-bold font-display">Bulk File Importer</CardTitle>
                        <CardDescription>
                            Import records securely using Frappe&apos;s background Data Import architecture.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={selectedDocType} onValueChange={handleDocTypeChange} disabled={currentState !== "Idle" && currentState !== "Selected" && currentState !== "Failed"}>
                            <SelectTrigger className="w-52" data-testid="select-doctype">
                                <SelectValue placeholder="Select Target DocType" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(DOCTYPE_COLUMNS).map((dt) => (
                                    <SelectItem key={dt} value={dt}>
                                        {dt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={handleDownloadTemplate}
                            data-testid="button-download-template"
                            className="hover:bg-primary/5 hover:text-primary transition-all duration-300"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Expected Column Badges */}
                    <div className="p-4 rounded-xl border border-muted bg-muted/20">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Expected Columns for {selectedDocType}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {DOCTYPE_COLUMNS[selectedDocType]?.map((col) => (
                                <Badge
                                    key={col.fieldname}
                                    variant={col.required ? "default" : "outline"}
                                    className={`px-2.5 py-1 text-xs transition-all duration-300 ${col.required
                                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm"
                                        : "text-muted-foreground hover:bg-muted"
                                        }`}
                                >
                                    {col.label} {col.required && "*"}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                            * Note: Items marked with (*) are mandatory in the spreadsheet header structure.
                        </p>
                    </div>

                    {/* Drag-and-Drop Area */}
                    {currentState === "Idle" || currentState === "Selected" || currentState === "Failed" ? (
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`group relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${dragActive
                                ? "border-primary bg-primary/5 scale-[0.99] shadow-inner"
                                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/10 hover:shadow-md"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv, .xls, .xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <div className="p-4 rounded-full bg-primary/5 border border-primary/10 group-hover:scale-110 transition-transform duration-300">
                                <UploadCloud className="h-10 w-10 text-primary/70 group-hover:text-primary" />
                            </div>

                            <p className="mt-4 text-sm font-semibold text-foreground">
                                {file ? `Selected file: ${file.name}` : "Drag and drop your spreadsheet file here"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports CSV, XLS, and XLSX (Max 10MB)"}
                            </p>

                            {!file && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="mt-4 pointer-events-none group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                                >
                                    Browse Files
                                </Button>
                            )}
                        </div>
                    ) : null}

                    {/* File validation & Processing progress display */}
                    {currentState !== "Idle" && currentState !== "Selected" && currentState !== "Failed" && currentState !== "Complete" ? (
                        <div className="space-y-4 p-6 rounded-xl border bg-muted/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <div>
                                        <p className="text-sm font-bold capitalize">
                                            {currentState.replace("_", " ")}...
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {currentState === "Processing" && jobStatus
                                                ? `Frappe Import Status: ${jobStatus}`
                                                : "Executing operational pipeline sequence"}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-primary">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2.5 transition-all duration-500" />
                        </div>
                    ) : null}

                    {/* Error Box */}
                    {errorMessage && (
                        <Alert variant="destructive" className="bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400">
                            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <AlertTitle className="font-bold">Execution Error</AlertTitle>
                            <AlertDescription className="text-sm leading-relaxed">
                                {errorMessage}
                                {missingColumns.length > 0 && (
                                    <div className="mt-2 text-xs font-semibold">
                                        Please add the following required headers to your file: {missingColumns.join(", ")}
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Trigger Actions */}
                    {file && (currentState === "Selected" || currentState === "Failed") && (
                        <div className="flex items-center gap-3 justify-end">
                            <Button variant="ghost" onClick={() => resetStates(true)} disabled={customUploadLoading || createLoading || triggerLoading}>
                                Clear File
                            </Button>
                            <Button
                                onClick={handleStartImport}
                                disabled={customUploadLoading || createLoading || triggerLoading}
                                data-testid="button-start-import"
                                className="bg-gradient-to-r from-indigo-500 to-primary hover:shadow-lg transition-all duration-300"
                            >
                                {customUploadLoading || createLoading || triggerLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Running Pipeline...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Start Bulk Import
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Process completed state display details */}
                    {currentState === "Complete" && (
                        <div className="space-y-6">
                            <Alert className="bg-green-500/5 border-green-500/25">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                                <AlertTitle className="font-bold text-green-800 dark:text-green-400">
                                    Background Import Completed!
                                </AlertTitle>
                                <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                                    The background Celery/RQ job has finished.
                                    <div className="grid grid-cols-3 gap-4 mt-4 p-4 rounded-lg bg-background border">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Total Rows Checked</p>
                                            <p className="text-xl font-bold">{totalRows}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground font-semibold text-green-600">Successfully Imported</p>
                                            <p className="text-xl font-bold text-green-600">{successRows}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground font-semibold text-red-500">Failed Rows</p>
                                            <p className="text-xl font-bold text-red-500">{totalRows - successRows}</p>
                                        </div>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            {/* Import Logs Table */}
                            {importLogs.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold font-display flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Detailed Import Logs
                                    </h3>
                                    <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                                        <Table>
                                            <TableHeader className="bg-muted sticky top-0 z-10">
                                                <TableRow>
                                                    <TableHead className="w-20">Row</TableHead>
                                                    <TableHead className="w-28">Status</TableHead>
                                                    <TableHead>Messages</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {importLogs.map((log, idx) => (
                                                    <TableRow key={idx} className="hover:bg-muted/10">
                                                        <TableCell className="font-mono text-xs font-semibold">{log.row}</TableCell>
                                                        <TableCell>
                                                            {log.success ? (
                                                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 font-bold text-[10px]">
                                                                    SUCCESS
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 font-bold text-[10px]">
                                                                    FAILED
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-mono leading-relaxed max-w-[400px] truncate-3-lines">
                                                            {log.messages.map((msg, mIdx) => (
                                                                <div key={mIdx} className={log.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                                    {msg}
                                                                </div>
                                                            ))}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button onClick={() => resetStates(true)} className="px-5 shadow-sm">
                                    Upload Another File
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
