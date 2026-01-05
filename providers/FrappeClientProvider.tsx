'use client';

import { FrappeProvider } from "frappe-react-sdk";

export function FrappeClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <FrappeProvider
        
            url={process.env.NEXT_PUBLIC_FRAPPE_BASE_URL!}
            tokenParams={{
                useToken: true,
                
                token: () =>
                    typeof window !== "undefined"
                        ? localStorage.getItem("frappe_access_token") ?? ""
                        : "",
                type: "Bearer",
            }}
            enableSocket={false}
            
        >
            {children}

        </FrappeProvider>
    );
}