import { Room, RoomEvent, Track } from 'livekit-client';

let room = null;
let remoteAudioElements = new Set();

const removeAudioElements = () => {
  remoteAudioElements.forEach((audioEl) => audioEl.remove());
  remoteAudioElements = new Set();
};

export const liveKitVideoService = {
  async join({
    serverUrl,
    token,
    isHost,
    onVideoTrackSubscribed,
    onVideoTrackUnsubscribed,
    onDisconnect,
  }) {
    await this.leave();

    const activeRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    room = activeRoom;

    activeRoom.on(RoomEvent.Disconnected, () => {
      removeAudioElements();
      onDisconnect?.();
    });

    activeRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Video) {
        onVideoTrackSubscribed?.(track, participant);
      } else if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
        remoteAudioElements.add(audioElement);
      }
    });

    activeRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Video) {
        track.detach();
        onVideoTrackUnsubscribed?.(track, participant);
      } else if (track.kind === Track.Kind.Audio) {
        track.detach().forEach((el) => {
          remoteAudioElements.delete(el);
          el.remove();
        });
      }
    });

    try {
      await activeRoom.connect(serverUrl, token);

      if (room !== activeRoom) {
        activeRoom.disconnect();
        return null;
      }

      if (isHost) {
        await activeRoom.localParticipant.setCameraEnabled(true);
        await activeRoom.localParticipant.setMicrophoneEnabled(true);
      }

      // Check already subscribed remote tracks (e.g., if host was already publishing when viewer joins)
      activeRoom.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((pub) => {
          if (pub.track && pub.track.kind === Track.Kind.Video) {
            onVideoTrackSubscribed?.(pub.track, participant);
          } else if (pub.track && pub.track.kind === Track.Kind.Audio) {
            const audioElement = pub.track.attach();
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);
            remoteAudioElements.add(audioElement);
          }
        });
      });

      return activeRoom;
    } catch (error) {
      if (room === activeRoom) {
        room = null;
        activeRoom.disconnect();
        removeAudioElements();
      }
      throw error;
    }
  },

  attachLocalVideo(videoElement) {
    if (!room || !videoElement) return;
    const cameraPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    if (cameraPub?.track) {
      cameraPub.track.attach(videoElement);
    }
  },

  async setCameraEnabled(enabled, videoElement) {
    if (!room) return null;
    const pub = await room.localParticipant.setCameraEnabled(enabled);
    if (enabled && videoElement) {
      if (pub?.track) {
        pub.track.attach(videoElement);
      } else {
        this.attachLocalVideo(videoElement);
      }
    }
    return pub;
  },

  async setMicrophoneEnabled(enabled) {
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(enabled);
  },

  isCameraEnabled() {
    if (!room) return false;
    return room.localParticipant.isCameraEnabled;
  },

  isMicrophoneEnabled() {
    if (!room) return false;
    return room.localParticipant.isMicrophoneEnabled;
  },

  getLocalVideoTrack() {
    if (!room) return null;
    const cameraPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    return cameraPub?.track || null;
  },

  async leave() {
    if (!room) return;
    const activeRoom = room;
    room = null;
    try {
      if (activeRoom.localParticipant) {
        await activeRoom.localParticipant.setCameraEnabled(false);
        await activeRoom.localParticipant.setMicrophoneEnabled(false);
      }
      activeRoom.disconnect();
    } catch (e) {
      console.warn('Error during video leave:', e);
    } finally {
      removeAudioElements();
    }
  },
};

