## Study journal
This is a study journal mobile app designed for productivity tracking inspired by [sonny journal ai](https://github.com/sonnysangha/journal-ai-app-react-native-expo-sanity-clerk-billing-openai-vercel-ai-tamagui) built with Expo (React Native), Clerk, Supabase, and OpenAI GPT. This project is educational.


🚧  Still under development.

<b>Existing Features</b>
- Write your study journal to record your academic journey.
- Dashboard analyzing your productivity and counting streak to track commitment.
- chat with AI to reflect and further analyze your study habit, make planner for you, etc.


<b>Preview</b>

<p align="center">
   <img src="https://github.com/user-attachments/assets/7b27e453-6139-4c8c-bf41-6836ebaace26" width=300>
   <img src="https://github.com/user-attachments/assets/9cc437d6-7d8f-44b0-973e-9b619cd2d397" width=300>
   <img src="https://github.com/user-attachments/assets/5b304e49-fa9f-41d5-8910-899e00fab9c7" width=300>
</p>

<b>Video Showcase</b>

<p align="center">
<img src="https://github.com/user-attachments/assets/bb983ddf-a17c-4bd9-892e-bb031c676a47" width=300>
<img src="https://github.com/user-attachments/assets/55f80da9-9086-4f0e-bf37-5d779b054b4a" width=300>
</p>


<b>Future Features to be implemented</b>
- customizable subjects! Right now there are fixed 5 subjects for demonstration.
- calendar to visualize journal better (month/year calendar)
- more dashboard analysis (graph, chart etc.)
- store AI chat history


## How to set up the project
### Prerequisite
```
Node.js 18+
npm or pnpm
To run the app: iOS Simulator (Mac only with Xcode) or Android Emulator (Android Studio) or Expo Go on your android phone
Accounts: Clerk, Supabase, OpenAI
```
Steps
1. Install dependencies.

   ```bash
   npm install
   ```
2. Add .env file. Replace with your Clerk, Supabase, OpenAI keys.
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=replace_with_your_values
CLERK_SECRET_KEY=replace_with_your_values

EXPO_PUBLIC_SUPABASE_URL=replace_with_your_values
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace_with_your_values

OPENAI_API_KEY=replace_with_your_values
```
3. Set up tables in Supabase database like these.
```
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.entry_subjects (
  entry_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  subject_id uuid NOT NULL,
  CONSTRAINT entry_subjects_pkey PRIMARY KEY (entry_id, subject_id),
  CONSTRAINT entry_subjects_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT entry_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
);
CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id text NOT NULL,
  entry_timestamp timestamp with time zone NOT NULL,
  title text,
  content text NOT NULL,
  productivity smallint NOT NULL CHECK (productivity >= 1 AND productivity <= 5),
  image_path text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id text NOT NULL,
  name text NOT NULL CHECK (length(TRIM(BOTH FROM name)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint,
  color text NOT NULL DEFAULT '#888888'::text CHECK (color ~ '^#[0-9A-Fa-f]{6}$'::text),
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
```
4. [Integrate Supabase with Clerk](https://clerk.com/docs/guides/development/integrations/databases/supabase). Create RLS policies on each tables on SELECT, UPDATE, DELETE, POST, PUT.
5. Create a JWT template named 'supabase' in Clerk project's config. Customize the session token as
```
{
  "role": "authenticated"
}
``` 
6. Start the app.

   ```bash
   npx run start
   ```
