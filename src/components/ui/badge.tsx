

import { badgeVariants } from "./badge_utils";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
    variant?: BadgeVariant;
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
