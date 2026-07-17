import { LivePageView } from '../../../components/dashboard/live';
import { liveClasses } from '../../../lib/dashboard';

export default function LiveClassesPage(): React.JSX.Element {
  return <LivePageView classes={liveClasses} />;
}
