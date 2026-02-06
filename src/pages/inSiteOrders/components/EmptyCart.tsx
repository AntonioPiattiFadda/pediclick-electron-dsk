import {
    Empty,
    EmptyDescription,
    EmptyHeader,

} from "@/components/ui/empty"

export function EmptyCart() {
    return (
        <Empty>
            <EmptyHeader>
                {/* <EmptyMedia variant="icon">
                 <IconFolderCode /> 
            </EmptyMedia> */}
                {/* <EmptyTitle>Selecciona un producto</EmptyTitle> */}
                <EmptyDescription>
                    Comienza seleccionando un producto.
                </EmptyDescription>
            </EmptyHeader>
            {/* <EmptyContent>
                <div className="flex gap-2">
                    <Button>Create Project</Button>
                    <Button variant="outline">Import Project</Button>
                </div>
            </EmptyContent> */}
            {/* <Button
                variant="link"
                asChild
                className="text-muted-foreground"
                size="sm"
            >
                <a href="#">
                    Learn More <ArrowUpRightIcon />
                </a> 
        </Button>*/}
        </Empty >
    )
}
