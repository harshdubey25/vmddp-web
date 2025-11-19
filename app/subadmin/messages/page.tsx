"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFrappeGetDocList } from "frappe-react-sdk";
import AdminSidebar from "@/components/AdminSidebar";
import { MessageSquare, User, Phone, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get user's district from auth context
  useEffect(() => {
    if (user?.dpo?.district) {
      setUserDistrict(user.dpo.district);
    }
  }, [user]);

  const { data: messages, isLoading: messagesLoading } = useFrappeGetDocList("Contact Us", {
    fields: ["name", "district", "full_name", "mobile_number", "message", "creation"],
    filters: userDistrict ? [["district", "=", userDistrict]] : [],
    orderBy: { field: "creation", order: "asc" },
    limit_start: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
  });

  // Get total count for pagination
  const { data: totalCountData } = useFrappeGetDocList("Contact Us", {
    fields: ["name"],
    filters: userDistrict ? [["district", "=", userDistrict]] : [],
    limit: 1000, // Get all to count
  });

  const totalMessages = totalCountData?.length || 0;
  const totalPages = Math.ceil(totalMessages / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar userRole="subadmin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-14 sm:h-16 items-center justify-between border-b pl-12 pr-3 py-3 md:px-6 bg-background">
          <div>
            <h1 className="font-display font-semibold text-base sm:text-lg md:text-xl" data-testid="text-messages-title">
              Contact Messages
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Messages{userDistrict ? ` (${userDistrict})` : ""}
            </p>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-muted/30">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse space-y-3 sm:space-y-4 w-full max-w-2xl mx-auto">
                <div className="h-3 sm:h-4 bg-muted rounded w-32 sm:w-48"></div>
                <div className="h-24 sm:h-32 bg-muted rounded"></div>
                <div className="h-24 sm:h-32 bg-muted rounded"></div>
              </div>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    <span className="hidden xs:inline">Showing </span>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalMessages)} of {totalMessages}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Previous</span>
                  </Button>
                  <span className="text-xs sm:text-sm text-muted-foreground px-1 sm:px-2">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              {messages.map((msg: ContactMessage) => (
                <Card key={msg.name} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col xs:flex-row items-start justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-base md:text-lg font-semibold flex items-center gap-1 sm:gap-2">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{msg.full_name}</span>
                        </CardTitle>
                        <div className="flex flex-col xs:flex-row xs:flex-wrap xs:items-center gap-1 xs:gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{msg.mobile_number}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{msg.district}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{new Date(msg.creation).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {msg.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination at bottom */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-2 pt-4 sm:pt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Previous</span>
                  </Button>
                  <span className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-4">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-3">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6 sm:p-8 text-center">
                  <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">No Messages Found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
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






