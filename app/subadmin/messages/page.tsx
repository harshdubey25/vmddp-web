"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFrappeGetDocList } from "frappe-react-sdk";
import AdminSidebar from "@/components/AdminSidebar";
import { MessageSquare, User, Phone, MapPin, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ContactMessage {
  name: string;
  district: string;
  full_name: string;
  mobile_number: string;
  message: string;
  creation: string;
}

export default function SubAdminMessages() {
  const { user } = useAuth();
  const [userDistrict, setUserDistrict] = useState<string | null>(null);

  // Get user's district from auth context
  useEffect(() => {
    if (user?.dpo?.district) {
      setUserDistrict(user.dpo.district);
    }
  }, [user]);

  const { data: messages, isLoading: messagesLoading } = useFrappeGetDocList("Contact Us", {
    fields: ["name", "district", "full_name", "mobile_number", "message", "creation"],
    filters: userDistrict ? [["district", "=", userDistrict]] : [],
    orderBy: { field: "creation", order: "desc" },
    limit: 100,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar userRole="subadmin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
          <div>
            <h1 className="font-display font-semibold text-xl" data-testid="text-messages-title">
              Contact Messages
            </h1>
            <p className="text-sm text-muted-foreground">
              Messages from your district{userDistrict ? ` (${userDistrict})` : ""}
            </p>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-48"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </span>
              </div>
              {messages.map((msg: ContactMessage) => (
                <Card key={msg.name} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {msg.full_name}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {msg.mobile_number}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {msg.district}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(msg.creation).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {msg.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Messages Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {userDistrict
                      ? `No contact messages found for ${userDistrict} district`
                      : "No contact messages available"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}






