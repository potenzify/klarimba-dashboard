"use client";

import type { StepType } from "@/lib/api/content-schemas";
import { CoachingChatForm } from "./coaching-chat-form";
import { GoalReviewForm } from "./goal-review-form";
import { GuidedTextForm } from "./guided-text-form";
import { MindfulMediaForm } from "./mindful-media-form";
import { MultipleChoiceForm } from "./multiple-choice-form";
import { OutcomeResultForm } from "./outcome-result-form";
import { GalleryReviewForm, PhotoCollectForm, PhotoReflectionForm } from "./photo-forms";
import { ReviewForm } from "./review-form";
import { RolePlayForm } from "./role-play-form";
import { ScenarioForm } from "./scenario-form";
import { SliderChoiceForm } from "./slider-choice-form";
import type { StepFormProps } from "./types";
import { VoiceAffirmationForm } from "./voice-affirmation-form";

/** Formulario de edición del contenido en español según el tipo de step. */
export function StepForm({ stepType, ...props }: StepFormProps & { stepType: StepType }) {
  switch (stepType) {
    case "multiple_choice":
      return <MultipleChoiceForm {...props} />;
    case "slider_choice":
      return <SliderChoiceForm {...props} />;
    case "voice_affirmation":
      return <VoiceAffirmationForm {...props} />;
    case "audio_review":
    case "text_review":
      return <ReviewForm {...props} />;
    case "guided_text":
      return <GuidedTextForm {...props} />;
    case "guided_text_edit":
      return <GuidedTextForm {...props} editable />;
    case "role_play_dialog":
      return <RolePlayForm {...props} />;
    case "outcome_result":
      return <OutcomeResultForm {...props} />;
    case "mindful_media":
      return <MindfulMediaForm {...props} />;
    case "photo_collect":
      return <PhotoCollectForm {...props} />;
    case "photo_reflection":
      return <PhotoReflectionForm {...props} />;
    case "gallery_review":
      return <GalleryReviewForm />;
    case "goal_review":
      return <GoalReviewForm {...props} />;
    case "scenario":
      return <ScenarioForm {...props} />;
    case "coaching_chat":
      return <CoachingChatForm {...props} />;
    default:
      return null;
  }
}
