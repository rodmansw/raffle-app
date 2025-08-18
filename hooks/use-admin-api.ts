import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { getApiUrl, getAdminEmail } from "@/config/env";

// Types
export interface Raffle {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  ticket_price: number;
  max_ticket_digits: number;
  total_tickets: number | null;
  status: "draft" | "open" | "closed" | "completed";
  winner_ticket_number: string | null;
  winner_email: string | null;
  created_at: string;
  updated_at: string;
  opened_at: string | null;
  closed_at: string | null;
}

export interface Submission {
  id: string;
  raffle_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  account_holder_name: string | null;
  ticket_quantity: number;
  ticket_price: number;
  payment_method: string;
  reference_code: string;
  payment_proof_base64: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  raffle?: {
    title: string;
    status: string;
  };
  tickets?: Ticket[];
}

export interface Ticket {
  id: string;
  submission_id: string;
  ticket_number: string;
  created_at: string;
  submission?: {
    full_name: string;
    email: string;
    ticket_quantity: number;
    payment_method: string;
    created_at: string;
  };
}

export interface Stats {
  total_submissions: number;
  pending_submissions: number;
  approved_submissions: number;
  rejected_submissions: number;
  total_tickets_requested: number;
  total_tickets_assigned: number;
  total_revenue: number;
}

// API Base URL - Use environment variables
const API_BASE_URL = getApiUrl("");
const ADMIN_EMAIL = getAdminEmail();

console.log("API_BASE_URL", API_BASE_URL);
console.log("ADMIN_EMAIL", ADMIN_EMAIL);

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_EMAIL}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error Response:", errorText);

    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }

    throw new Error(
      errorData.error || `API request failed: ${response.status}`
    );
  }

  const data = await response.json();
  return data;
};

// Hooks
export const useCurrentRaffle = () => {
  return useQuery({
    queryKey: ["currentRaffle"],
    queryFn: async () => {
      const data = await apiCall("/raffles");

      // First try to find an open raffle
      const openRaffle = data.raffles.find((r: Raffle) => r.status === "open");
      if (openRaffle) {
        return openRaffle;
      }

      // If no open raffle, get the most recent one (for admin purposes)
      const sortedRaffles = data.raffles.sort(
        (a: Raffle, b: Raffle) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const mostRecent = sortedRaffles[0];
      return mostRecent;
    },
    staleTime: 0, // Always fetch fresh data
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
  });
};

export const useRaffles = () => {
  return useInfiniteQuery({
    queryKey: ["raffles"],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const params = new URLSearchParams();
      if (pageParam) params.append("cursor", pageParam);
      params.append("limit", "10");

      const data = await apiCall(`/raffles?${params}`);

      return data;
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
  });
};

export const useSubmissions = (status?: string, raffleId?: string) => {
  return useInfiniteQuery({
    queryKey: ["submissions", status, raffleId],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (raffleId) params.append("raffle_id", raffleId);
      if (pageParam) params.append("cursor", pageParam);
      params.append("limit", "10");

      const data = await apiCall(`/submissions?${params}`);

      return data;
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
  });
};

export const useStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const data = await apiCall("/stats");
      return data.stats;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
  });
};

export const useExistingTicketNumbers = (raffleId?: string) => {
  return useQuery({
    queryKey: ["existingTicketNumbers", raffleId],
    queryFn: async () => {
      if (!raffleId) return [];
      const data = await apiCall(`/tickets?raffle_id=${raffleId}`);
      return data.tickets?.map((ticket: Ticket) => ticket.ticket_number) || [];
    },
    enabled: !!raffleId,
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
  });
};

export const useUpdateSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiCall(`/submissions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["existingTicketNumbers"] });
      queryClient.invalidateQueries({ queryKey: ["approvedTickets"] });
    },
    onError: (error) => {
      console.error("Update submission error:", error);
    },
  });
};

export const useCloseRaffle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raffleId: string) => {
      return apiCall(`/raffles/${raffleId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "closed" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentRaffle"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error) => {
      console.error("Close raffle error:", error);
    },
  });
};

export const useCreateRaffle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Raffle>) => {
      return apiCall("/raffles", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raffles"] });
      queryClient.invalidateQueries({ queryKey: ["currentRaffle"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error) => {
      console.error("Create raffle error:", error);
    },
  });
};

export const useUpdateRaffle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      raffleId,
      data,
    }: {
      raffleId: string;
      data: Partial<Raffle>;
    }) => {
      return apiCall(`/raffles/${raffleId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raffles"] });
      queryClient.invalidateQueries({ queryKey: ["currentRaffle"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error) => {
      console.error("Update raffle error:", error);
    },
  });
};

export const useDeleteRaffle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raffleId: string) => {
      return apiCall(`/raffles/${raffleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raffles"] });
      queryClient.invalidateQueries({ queryKey: ["currentRaffle"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error) => {
      console.error("Delete raffle error:", error);
    },
  });
};

// Hook to fetch approved tickets with submission details
export const useApprovedTickets = (raffleId?: string) => {
  return useInfiniteQuery({
    queryKey: ["approvedTickets", raffleId],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const params = new URLSearchParams();
      if (raffleId) params.append("raffle_id", raffleId);
      if (pageParam) params.append("cursor", pageParam);
      params.append("limit", "10");
      const data = await apiCall(`/tickets/approved?${params}`);
      return data;
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.nextCursor
        : undefined;
    },
    enabled: !!raffleId,
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
  });
};

// Helper function to generate random ticket numbers
export const generateRandomTicketNumbers = (
  count: number,
  maxDigits: number,
  existingNumbers: string[] = []
): string[] => {
  const numbers: string[] = [];
  const maxNumber = Math.pow(10, maxDigits) - 1;

  while (numbers.length < count) {
    const randomNumber = Math.floor(Math.random() * maxNumber) + 1;
    const ticketNumber = randomNumber.toString().padStart(maxDigits, "0");

    if (
      !existingNumbers.includes(ticketNumber) &&
      !numbers.includes(ticketNumber)
    ) {
      numbers.push(ticketNumber);
    }
  }

  return numbers;
};
