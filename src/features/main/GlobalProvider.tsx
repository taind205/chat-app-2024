'use client'
import store from "@/store";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Provider } from "react-redux";
import { GlobalModal } from "./GlobalModal";
import { useFetchMissingConversations } from "@/features/conversations/hook";
import { useDecorateMessage, useFetchMissingMessages } from "@/features/messages/hook";
import { useFetchMissingUsers, useFetchOnlineStatus } from "@/features/users/hook";

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);
    
      useEffect(() => {
        setHasMounted(true);
      }, []); // Empty dependency array to run only once on mount
      

    return (
      <Provider store={store}>
          {children}
          {hasMounted && createPortal(<>
            <GlobalModal />
            <GlobalHooks />
          </>, document.body)}
      </Provider>
    );
};


const GlobalHooks:React.FC<{}> = ({}) => { 
  const fetchMissingConv = useFetchMissingConversations();
  const fetchMissingMsg = useFetchMissingMessages(); //fetch missing conv & rep msg 
  const fetchOnlineStatus = useFetchOnlineStatus();
  const fetchMissingUser = useFetchMissingUsers();
  const decorateMsg = useDecorateMessage();

  return (<></>)
}