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

interface BeneficiaryData {
  district: string;
  component: string;
  selected: number;
  rejected: number;
  inProgress: number;
}

interface BeneficiaryTableProps {
  data: BeneficiaryData[];
}

export default function BeneficiaryTable({ data }: BeneficiaryTableProps) {
  return (
    <Card data-testid="card-beneficiary-table">
      <CardHeader>
        <CardTitle className="font-display">Application Statistics</CardTitle>
        <CardDescription>District and component-wise application status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">District</TableHead>
                <TableHead className="font-semibold">Component</TableHead>
                <TableHead className="text-center font-semibold">Selected</TableHead>
                <TableHead className="text-center font-semibold">Rejected</TableHead>
                <TableHead className="text-center font-semibold">In Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} data-testid={`row-beneficiary-${index}`}>
                  <TableCell className="font-medium">{row.district}</TableCell>
                  <TableCell>{row.component}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-chart-3 hover:bg-chart-3" data-testid={`badge-selected-${index}`}>
                      {row.selected}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-chart-5 hover:bg-chart-5" data-testid={`badge-rejected-${index}`}>
                      {row.rejected}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-chart-4 hover:bg-chart-4" data-testid={`badge-inprogress-${index}`}>
                      {row.inProgress}
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
