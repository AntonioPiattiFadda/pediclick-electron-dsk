
const useScale = () => {



    const handleConnectScale = () => {
        try {
            console.log("Opening scale serial port...");
            window.scale.connectScale("COM6", { baudRate: 9600 });
        } catch (error) {
            console.error("Error al imprimir:", error);
        }
    };

    return { handleConnectScale };

};

export default useScale;