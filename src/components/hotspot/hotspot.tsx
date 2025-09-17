import { useHotspot } from "../../hooks/useHotspot";

const Hotspot = () => {
  const {
    loading: hotspotLoading,
    status,
    createHotspot,
    stopHotspot,
    error: hotsportError,
    currentHotspot,
  } = useHotspot();

  return (
    <div>
      <button
        onClick={() =>
          createHotspot({
            ssid: "TestSSID",
            password: "TestPass123",
            interface: "wlan0",
          })
        }
      >
        {hotspotLoading ? "Creating Hotspot..." : "Create Hotspot"}
      </button>
      {status === "active" && (
        <div>
          <p>Hotspot Active!</p>
          <p>SSID: {currentHotspot?.ssid}</p>
          <p>Password: {currentHotspot?.password}</p>
          <button onClick={stopHotspot}>Stop Hotspot</button>
        </div>
      )}
      {status === "error" && <p style={{ color: "red" }}>{hotsportError}</p>}
      {status === "inactive" && <p>Hotspot Inactive</p>}
    </div>
  );
};

export default Hotspot;
