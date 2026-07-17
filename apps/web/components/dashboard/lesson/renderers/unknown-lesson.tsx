import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import { lessonPlayerCopy, type UnknownContentDto } from '../../../../lib/dashboard';

export function UnknownLesson({ content }: { content: UnknownContentDto }): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" role="status">
      <CardHeader>
        <CardTitle className="text-base">{lessonPlayerCopy.unknownTitle}</CardTitle>
        <CardDescription>{content.message}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-small text-muted-foreground">
          Future lesson types can register additional renderers without changing the player shell.
        </p>
      </CardContent>
    </Card>
  );
}
