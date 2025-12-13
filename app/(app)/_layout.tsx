import { Stack } from "expo-router";

export default function Layout() {
  // const { isLoaded, 
  //   isSignedIn 
  // } = useAuth();

  // if (!isLoaded) {
  //   return <Spinner />;
  // }

  return (
    <Stack>
      {/* TODO: authen */}
      {/* <Stack.Protected guard={isSignedIn}> */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="new-entry" options={{ headerShown: false }} />
        {/* <Stack.Screen name="edit-entry/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="entry/[id]" options={{ headerShown: false }} /> */}
      {/* </Stack.Protected> */}

    </Stack>
  );
}
