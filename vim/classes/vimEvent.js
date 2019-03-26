
/**
 * Represents an event created by the VIM for the purpose
 * of managing a VM.
 *
 * @class VIMEvent
 */
class VIMEvent {

    /**
     * Creates an instance of VIMEvent.
     * @param {number} vmID The id of the VM this event is about.
     * @param {number} ccID The id of the cloud consumer who owns the VM (I think).
     * @param {number} vmConfig The type of the VM. 1 = `Basic`, 2 = `Large`, 3 = `UltraLarge`.
     * @param {String} eventType The type of this event. Must be one of: `create`, `start`, `stop`, `delete`, `upgrade`, or `downgrade`.
     * @param {Date} timestamp The timestamp of when the event occurred.
     * @memberof VIMEvent
     */
    constructor(vmID, ccID, vmConfig, eventType, timestamp) {
        this.vmID = vmID;
        this.ccID = ccID;
        this.vmConfig = vmConfig;
        this.eventType = eventType;
        this.timestamp = timestamp;
    }
}

module.exports = VIMEvent;