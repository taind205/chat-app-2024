'use client'
import { GlobalProvider } from "@/features/main/GlobalProvider";
import { UserUI } from "@/features/main/main";

const App: React.FC = () => {
  return (
  <GlobalProvider>
    <UserUI />
  </GlobalProvider>
  );
};

export default App;