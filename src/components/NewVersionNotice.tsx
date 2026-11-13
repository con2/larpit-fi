"use client";

import { createContext, ReactNode, useContext } from "react";

const NewVersionNoticeContext = createContext<ReactNode>(null);

/**
 * Makes the "new version" page available to the error boundary, which is a Client Component
 * and cannot render the server-side page chrome itself.
 */
export function NewVersionNoticeProvider({
  notice,
  children,
}: {
  notice: ReactNode;
  children: ReactNode;
}) {
  return (
    <NewVersionNoticeContext.Provider value={notice}>
      {children}
    </NewVersionNoticeContext.Provider>
  );
}

export function useNewVersionNotice(): ReactNode {
  return useContext(NewVersionNoticeContext);
}
