"use client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface BeneficiaryData {
  district: string;
  component: string;
  pending: number;
  approved: number;
  selected: number;
  rejected: number;
}

interface BeneficiaryTableProps {
  data: BeneficiaryData[];
}

export default function BeneficiaryTable({ data }: BeneficiaryTableProps) {
  const router = useRouter();

  const handleRowClick = (district: string, component: string) => {
    router.push(`/report/${district}/${encodeURIComponent(component)}`);
  };

  return (
    <Card data-testid="card-beneficiary-table">
      <CardHeader>
        <CardTitle className="font-display">Application Statistics</CardTitle>
        <CardDescription>District and component-wise application status • Click row for details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">District</TableHead>
                <TableHead className="font-semibold">Component</TableHead>
                <TableHead className="text-center font-semibold">Pending</TableHead>
                <TableHead className="text-center font-semibold">Approved</TableHead>
                <TableHead className="text-center font-semibold">Selected</TableHead>
                <TableHead className="text-center font-semibold">Rejected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={index}
                  data-testid={`row-beneficiary-${index}`}
                  className="cursor-pointer hover-elevate"
                  onClick={() => handleRowClick(row.district, row.component)}
                >
                  <TableCell className="font-medium">{row.district}</TableCell>
                  <TableCell>{row.component}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-chart-4 hover:bg-chart-4" data-testid={`badge-pending-${index}`}>
                      {row.pending}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-chart-3 hover:bg-chart-3" data-testid={`badge-approved-${index}`}>
                      {row.approved}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-chart-1 hover:bg-chart-1" data-testid={`badge-selected-${index}`}>
                      {row.selected}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-chart-5 hover:bg-chart-5" data-testid={`badge-rejected-${index}`}>
                      {row.rejected}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
