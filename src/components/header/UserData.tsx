import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES } from "@/constants";
import { RootState } from "@/stores/store";
import { useSelector } from "react-redux";


const UserData = () => {

    const userData = useSelector((state: RootState) => state.user);

    if (!userData) {
        return <Skeleton className="h-8 w-48" />
    }

    return (<div className="flex items-center gap-3" >
        <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-foreground">
                {userData?.email}
            </p>
            <p className="text-xs text-muted-foreground">
                Rol:{" "}
                {ROLES.find((role) => role.value === userData?.role)?.label}
            </p>
        </div>

        <Avatar className="w-8 h-8">
            <AvatarImage
                src={`https://ui-avatars.com/api/?name=${userData?.full_name || userData?.email
                    }`}
                alt="Usuario"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {/* JP */}
            </AvatarFallback>
        </Avatar>

        {/* <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
        >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline ml-2">Salir</span>
        </Button> */}
    </div >
    )

}

export default UserData