import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VideoDialog } from "./VideoDialog";
import { QuestionWithDetails } from "@/lib/database";


export function QuestionsTable({ questions }: { questions: QuestionWithDetails[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead>Acceptance</TableHead>
          <TableHead>Video</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((question) => (
          // 4. Use the numerical 'id' for the key
          <TableRow key={question.id}>
            {/* 5. Display the string 'ID' (the slug) in the table cell */}
            <TableCell>{question.ID}</TableCell> 
            <TableCell>{question.title}</TableCell>
            {/* 6. Use 'Difficulty' (capital D) which is already "Easy", "Medium", "Hard" */}
            <TableCell>{question.Difficulty}</TableCell>
            {/* 7. Use 'Acceptance %' (which is already formatted) */}
            <TableCell>{question["Acceptance %"]}</TableCell>
            <TableCell>
              {/* 8. Pass the NUMERICAL 'id' to the VideoDialog */}
              <VideoDialog id={question.id} title={question.title} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}