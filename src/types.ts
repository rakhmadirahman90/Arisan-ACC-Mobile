export interface Member {
  id: string;
  name: string;
  vehicle: string;
  phone: string;
  joinDate: string;
  wonRound: number | null; // null if hasn't won yet, otherwise the round number they won
  avatarColor: string; // Tailwind bg color class
  photo?: string; // Base64 compressed image
}

export interface ArisanConfig {
  contributionAmount: number; // in Rupiah
  currentRound: number;
  totalRounds: number;
  nextDrawDate: string;
  livery?: "blue" | "green" | "orange" | "red" | "lime";
  raffleActiveTime?: string; // Datetime ISO string or locale datetime string when raffle unlocks
  // ARISAN / MEETUP GATHERING
  meetupLocationName?: string;
  meetupAddress?: string;
  meetupMapQuery?: string;
  meetupTime?: string;
  meetupImage?: string;
}

export interface ArisanHistory {
  id: string;
  round: number;
  winnerId: string;
  winnerName: string;
  winnerVehicle: string;
  drawnAt: string;
  prizeAmount: number;
  participantsCount: number;
}

export interface PaymentStatus {
  memberId: string;
  round: number;
  isPaid: boolean;
  paidAt?: string;
}
