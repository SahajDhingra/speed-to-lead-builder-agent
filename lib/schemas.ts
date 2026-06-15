import { z } from "zod";

/** Structured context the ingestion agent produces from raw client data. */
export const ClientProfileSchema = z.object({
  businessName: z.string(),
  trade: z.string(),                         // "roofing"
  services: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      priceRange: z.string(),                // "$8,000–$25,000"
      typicalDuration: z.string().optional(),
    })
  ),
  serviceArea: z.object({
    locations: z.array(z.string()),          // cities / zips covered
    notes: z.string().optional(),            // radius, exclusions
  }),
  hours: z.object({
    regular: z.string(),
    emergencyAvailable: z.boolean(),
    emergencyNotes: z.string().optional(),
  }),
  bookingRules: z.string(),                  // info needed, lead time, dispatch logic
  brandVoice: z.object({
    tone: z.array(z.string()),               // ["friendly", "no-pressure", "expert"]
    dos: z.array(z.string()),
    donts: z.array(z.string()),
  }),
  faqs: z.array(
    z.object({ question: z.string(), answer: z.string() })
  ),
  qualification: z.object({
    idealLead: z.string(),                   // what a great lead looks like
    disqualifiers: z.array(z.string()),
    signals: z.array(z.string()),            // high-intent / high-value signals
  }),
  differentiators: z.array(z.string()),
  contact: z.object({
    email: z.string(),
    phone: z.string().optional(),
    website: z.string().optional(),
  }),
});
export type ClientProfile = z.infer<typeof ClientProfileSchema>;

/** A single inbound lead (used to simulate the system in Phase 2). */
export const LeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  source: z.string(),                        // "website form", "Google LSA", "referral"
  message: z.string(),                       // free-text inquiry
  receivedAt: z.string(),                    // ISO timestamp
});
export type Lead = z.infer<typeof LeadSchema>;

/** The speed-to-lead system the generation agent builds for a client. */
export const GeneratedSystemSchema = z.object({
  clientName: z.string(),
  version: z.number().default(1),
  generatedAt: z.string(),
  qualificationStrategy: z.object({
    goal: z.string(),
    questionsToAsk: z.array(z.string()),
    disqualifiers: z.array(z.string()),
    scoringApproach: z.string(),
  }),
  emailFlow: z.array(
    z.object({
      stepName: z.string(),                  // "Instant reply", "Follow-up 1"
      trigger: z.string(),                   // "On lead received", "If no reply in 24h"
      subject: z.string(),
      body: z.string(),                      // includes {placeholders}
      purpose: z.string(),
    })
  ),
  routingLogic: z.array(
    z.object({
      condition: z.string(),                 // "Emergency active leak"
      action: z.string(),                    // "Flag for immediate human call"
    })
  ),
  bookingCTA: z.string(),
  humanHandoffRules: z.array(z.string()),
});
export type GeneratedSystem = z.infer<typeof GeneratedSystemSchema>;
