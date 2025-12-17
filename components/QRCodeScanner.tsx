"use client"

import { useState } from "react";
import { X, Scan } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function QRCodeScanner() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300 flex items-center justify-center group hover:w-14 hover:h-14"
                aria-label="Open QR Scanner"
            >
                <Scan className="w-6 h-6 text-primary-foreground" />
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Scan className="w-5 h-5" />
                            Scan QR Code
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="relative w-full max-w-sm aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border">
                            <img
                                src="/qr_doc.jpg"
                                alt="QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        
                        <p className="text-sm text-muted-foreground text-center">
                            Scan this QR code with your mobile device to access the documents
                        </p>
                        
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
