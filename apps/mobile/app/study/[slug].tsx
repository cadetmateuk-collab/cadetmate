import { Redirect, useLocalSearchParams } from 'expo-router';
import { href } from '../../lib/href';

export default function LegacyStudyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <Redirect href={href(`/learn/study/${slug ?? ''}`)} />;
}
