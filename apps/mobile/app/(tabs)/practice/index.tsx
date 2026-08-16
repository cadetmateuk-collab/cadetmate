import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { HelpCircle, MessageCircleQuestion, Ship } from 'lucide-react-native';
import { useAuth } from '../../../lib/AuthContext';
import { href } from '../../../lib/href';
import { HubTile, Screen, Subheading } from '../../../components/ui';
import { type } from '../../../theme';

export default function PracticeScreen() {
  const router = useRouter();
  const { isPremium } = useAuth();

  return (
    <Screen scroll safeTop>
      <Text style={type.h1}>Practice</Text>
      <Subheading>Quiz yourself. 3D simulators stay on the website.</Subheading>

      <HubTile
        title="Daily quiz"
        subtitle="Free question of the day"
        icon={HelpCircle}
        onPress={() => router.push('/practice/quiz')}
      />
      <HubTile
        title="Oral questions"
        subtitle={isPremium ? 'Browse the question bank' : 'Included with Premium'}
        icon={MessageCircleQuestion}
        locked={!isPremium}
        onPress={() => router.push(href(isPremium ? '/practice/orals' : '/profile/store'))}
      />
      <HubTile
        title="Scenario challenges"
        subtitle="Coming soon on mobile"
        icon={Ship}
        disabled
      />
    </Screen>
  );
}
