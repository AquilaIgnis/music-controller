export interface roomData {
    code: number;
    created_at: string;
    guest_can_pause: boolean;
    host: string;
    id: number;
    isHost: boolean;
    votes_to_skip: number;
}

export type SpotifyAuthResponse = {
    status: boolean;
};

export interface PlayerProps {
    title: string;
    artist: string;
    duration: number;
    time: number;
    image_url: string;
    is_playing: boolean;
    votes: number;
    id: string;
}
