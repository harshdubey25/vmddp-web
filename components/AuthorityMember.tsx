import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AuthorityMemberProps {
  name: string;
  designation: string;
  image?: string;
  initials?: string;
}

export default function AuthorityMember({ name, designation, image, initials }: AuthorityMemberProps) {
  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`card-authority-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 mb-4">
            {image && <AvatarImage src={image} alt={name} className="object-cover" />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-display">
              {initials || name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="font-display font-semibold text-base mb-2" data-testid={`text-authority-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
            {name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{designation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
