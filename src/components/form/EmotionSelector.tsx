
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EmotionalState } from "@/types";

interface EmotionOption {
  value: EmotionalState;
  label: string;
}

interface EmotionSelectorProps {
  emotionalState: EmotionalState;
  onChange: (value: EmotionalState) => void;
}

const emotionOptions: EmotionOption[] = [
  { value: "happy", label: "Happy" },
  { value: "stressed", label: "Stressed" },
  { value: "bored", label: "Bored" },
  { value: "excited", label: "Excited" },
  { value: "sad", label: "Sad" },
  { value: "neutral", label: "Neutral" },
];

const EmotionSelector: React.FC<EmotionSelectorProps> = ({ emotionalState, onChange }) => {
  return (
    <div className="space-y-2">
      <Label>How do you feel?</Label>
      <RadioGroup
        value={emotionalState}
        onValueChange={(value) => onChange(value as EmotionalState)}
        className="grid grid-cols-3 gap-2"
      >
        {emotionOptions.map((emotion) => (
          <div key={emotion.value} className="flex items-center space-x-2">
            <RadioGroupItem value={emotion.value} id={`emotion-${emotion.value}`} />
            <Label htmlFor={`emotion-${emotion.value}`} className="cursor-pointer">
              {emotion.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default EmotionSelector;
