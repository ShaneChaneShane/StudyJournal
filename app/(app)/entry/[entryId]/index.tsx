import EntryViewScreen from "@/components/EntryViewScreen";
import { useLocalSearchParams } from "expo-router";

export default function EntryViewRoute() {
    const { entryId } = useLocalSearchParams<{ entryId: string }>();
    if (!entryId) return null;
    return <EntryViewScreen entryId={entryId} />;
}
