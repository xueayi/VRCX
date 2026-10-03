using System;

namespace VRCX
{
    /// <summary>
    /// Renderer-facing API for the "remote VRChat host" feature: VRChat runs on
    /// another LAN machine while VRCX tails its game log over SSH/SFTP.
    /// </summary>
    public partial class AppApiElectron
    {
        /// <summary>
        /// Persists and applies the remote host configuration.
        /// </summary>
        /// <param name="address">hostname or ip[:port] of the VRChat host</param>
        /// <param name="username">SSH username</param>
        /// <param name="password">SSH password (stored in the local VRCX.json)</param>
        /// <param name="logPath">optional explicit path of the remote VRChat log directory</param>
        public void SetRemoteHostConfig(string address, string username, string password, string logPath)
        {
            var storage = VRCXStorage.Instance;
            storage.Set("VRCX_RemoteHostAddress", address ?? string.Empty);
            storage.Set("VRCX_RemoteHostUsername", username ?? string.Empty);
            storage.Set("VRCX_RemoteHostPassword", password ?? string.Empty);
            storage.Set("VRCX_RemoteHostLogPath", logPath ?? string.Empty);

            if (storage.Get("VRCX_RemoteHostEnabled") == "true")
            {
                RemoteHostClient.Instance.Start(address, username, password, logPath);
                LogWatcher.Instance.Restart();
            }
        }

        /// <summary>
        /// Enables or disables tailing the remote host's game log.
        /// </summary>
        public void SetRemoteHostEnabled(bool enabled)
        {
            VRCXStorage.Instance.Set("VRCX_RemoteHostEnabled", enabled ? "true" : "false");

            if (enabled)
            {
                RemoteHostClient.Instance.StartFromConfig();
                LogWatcher.Instance.Restart();
            }
            else
            {
                RemoteHostClient.Instance.Stop();
                LogWatcher.Instance.Restart();
            }
        }

        /// <summary>
        /// JSON status snapshot for the settings UI: connection, detected log
        /// directory, current file, remote game-running state and last error.
        /// </summary>
        public string GetRemoteHostStatus()
        {
            return RemoteHostClient.Instance.GetStatusJson();
        }
    }
}
