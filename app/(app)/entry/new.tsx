import EntryEditorScreen from "@/components/EntryEditorScreen";
import { useLocalSearchParams } from "expo-router";

export default function NewEntryRoute() {
    const { promptTitle, promptText } = useLocalSearchParams<{
        promptTitle?: string;
        promptText?: string;
    }>();

    return (
        <EntryEditorScreen
            mode="create"
            promptTitle={promptTitle}
            promptText={promptText}
        />
    );
}
