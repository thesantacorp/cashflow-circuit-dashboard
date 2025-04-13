
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { EmotionalState } from '@/types';

const emotions: Array<EmotionalState | 'all'> = [
  'all', 'happy', 'excited', 'hopeful', 'neutral', 'bored', 'stressed', 'sad'
];

interface EmotionFilterProps {
  selectedEmotion: EmotionalState | 'all';
  onChange: (emotion: EmotionalState | 'all') => void;
}

const EmotionFilter: React.FC<EmotionFilterProps> = ({ selectedEmotion, onChange }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">Filter by emotion</Label>
        {selectedEmotion !== 'all' && (
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onChange('all')}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {emotions.map((emotion) => (
          <button
            key={emotion}
            onClick={() => onChange(emotion)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedEmotion === emotion
                ? getEmotionBgClass(emotion)
                : 'bg-background border border-input hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {emotion === 'all' ? 'All' : emotion.charAt(0).toUpperCase() + emotion.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

const getEmotionBgClass = (emotion: EmotionalState | 'all'): string => {
  switch (emotion) {
    case 'happy':
      return 'bg-green-500 text-white';
    case 'excited':
      return 'bg-blue-500 text-white';
    case 'hopeful':
      return 'bg-purple-400 text-white';
    case 'neutral':
      return 'bg-gray-500 text-white';
    case 'bored':
      return 'bg-yellow-500 text-white';
    case 'stressed':
      return 'bg-red-500 text-white';
    case 'sad':
      return 'bg-indigo-500 text-white';
    default:
      return 'bg-orange-500 text-white';
  }
};

export default EmotionFilter;
