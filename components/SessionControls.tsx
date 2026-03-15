"use client";

type SessionControlsProps = {
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  onCameraToggle: () => void;
  onEndSession: () => void;
  onMicToggle: () => void;
};

type IconProps = {
  className?: string;
};

function MicIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function MicOffIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m4 4 16 16" />
      <path d="M9 5.2A3 3 0 0 1 15 6v4.2" />
      <path d="M15 15.4A3 3 0 0 1 9 13V9.6" />
      <path d="M5 11a7 7 0 0 0 11.3 5.5" />
      <path d="M19 11a7 7 0 0 1-1.2 3.9" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </svg>
  );
}

function CameraIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 7a2 2 0 0 1 2-2h8.5l2 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function CameraOffIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m4 4 16 16" />
      <path d="M6.8 6H14l2 2H18a2 2 0 0 1 2 2v5.2" />
      <path d="M10.8 10.9A3.5 3.5 0 0 1 15.1 15" />
      <path d="M4 8.8V18a2 2 0 0 0 2 2h11.2" />
    </svg>
  );
}

function EndSessionIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="m8 8 8 8" />
      <path d="m16 8-8 8" />
    </svg>
  );
}

export default function SessionControls({
  isCameraEnabled,
  isMicEnabled,
  onCameraToggle,
  onEndSession,
  onMicToggle,
}: SessionControlsProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-cha-green-light/15 bg-cha-green-dark/40 px-2.5 py-2.5 shadow-[0_24px_80px_rgba(5,14,10,0.32)] backdrop-blur-2xl md:gap-3 md:px-3 md:py-3">
      <button
        aria-label={isMicEnabled ? "Mute microphone" : "Enable microphone and connect"}
        className={`flex h-12 w-12 items-center justify-center rounded-full border transition md:h-14 md:w-14 ${
          isMicEnabled
            ? "border-cha-green-light/24 bg-cha-green-light/14 text-cha-cream"
            : "border-cha-green-light/15 bg-cha-cream/6 text-cha-cream/72 hover:border-cha-green-light/28 hover:text-cha-cream"
        }`}
        onClick={onMicToggle}
        type="button"
      >
        {isMicEnabled ? (
          <MicIcon className="h-5 w-5 md:h-6 md:w-6" />
        ) : (
          <MicOffIcon className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </button>

      <button
        aria-label={isCameraEnabled ? "Disable camera" : "Enable camera"}
        className={`flex h-12 w-12 items-center justify-center rounded-full border transition md:h-14 md:w-14 ${
          isCameraEnabled
            ? "border-cha-green-light/24 bg-cha-green-light/14 text-cha-cream"
            : "border-cha-green-light/15 bg-cha-cream/6 text-cha-cream/72 hover:border-cha-green-light/28 hover:text-cha-cream"
        }`}
        onClick={onCameraToggle}
        type="button"
      >
        {isCameraEnabled ? (
          <CameraIcon className="h-5 w-5 md:h-6 md:w-6" />
        ) : (
          <CameraOffIcon className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </button>

      <button
        aria-label="End session"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-cha-orange/28 bg-cha-orange/18 text-cha-cream transition hover:border-cha-orange/45 hover:bg-cha-orange/28 md:h-14 md:w-14"
        onClick={onEndSession}
        type="button"
      >
        <EndSessionIcon className="h-5 w-5 md:h-6 md:w-6" />
      </button>
    </div>
  );
}
