import { Room, RoomEvent, Track } from 'livekit-client';

let room = null;
let audioElements = new Set();

const participantCount = () => (room ? room.remoteParticipants.size + 1 : 0);
const removeAudioElements = () => {
  audioElements.forEach((audioElement) => audioElement.remove());
  audioElements = new Set();
};

export const liveKitCallService = {
  async join({ serverUrl, token, onParticipantCountChange }) {
    await this.leave();

    room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    const notifyParticipantCount = () => onParticipantCountChange?.(participantCount());
    room.on(RoomEvent.ParticipantConnected, notifyParticipantCount);
    room.on(RoomEvent.ParticipantDisconnected, notifyParticipantCount);
    room.on(RoomEvent.Disconnected, () => {
      removeAudioElements();
      notifyParticipantCount();
    });
    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) return;

      const audioElement = track.attach();
      audioElement.autoplay = true;
      document.body.appendChild(audioElement);
      audioElements.add(audioElement);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) return;

      track.detach().forEach((audioElement) => {
        audioElements.delete(audioElement);
        audioElement.remove();
      });
    });

    try {
      await room.connect(serverUrl, token);
      await room.localParticipant.setMicrophoneEnabled(false);
      notifyParticipantCount();
    } catch (error) {
      await this.leave();
      throw error;
    }
  },

  async setMuted(muted) {
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(!muted);
  },

  async leave() {
    if (!room) return;

    const activeRoom = room;
    room = null;
    activeRoom.disconnect();
    removeAudioElements();
  },
};
