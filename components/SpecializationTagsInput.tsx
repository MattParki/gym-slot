"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { jobSpecialties } from "@/data/jobSpecialties";

interface SpecializationTagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

export default function SpecializationTagsInput({
  value = [],
  onChange,
  placeholder = "Add a specialization...",
  maxTags = 10
}: SpecializationTagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update filtered suggestions whenever input changes
  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredSuggestions(
        jobSpecialties
          .filter(suggestion => !value.includes(suggestion))
          .slice(0, 8)
      );
    } else {
      // Filter suggestions based on input
      const filtered = jobSpecialties
        .filter(suggestion => 
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) && 
          !value.includes(suggestion)
        )
        .slice(0, 8);
      
      setFilteredSuggestions(filtered);
    }
  }, [inputValue, value]);
  
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || inputValue.trim();
    
    if (tag !== "" && !value.includes(tag) && value.length < maxTags) {
      const newTags = [...value, tag];
      onChange(newTags);
      setInputValue("");
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const newTags = value.filter((_, index) => index !== indexToRemove);
    onChange(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      // Remove the last tag when backspace is pressed in an empty input
      handleRemoveTag(value.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If they paste with commas, split and add each tag
    const inputValue = e.target.value;
    if (inputValue.includes(",")) {
      const tagsToAdd = inputValue
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag !== "" && !value.includes(tag));
      
      if (tagsToAdd.length > 0) {
        const newTags = [...value, ...tagsToAdd].slice(0, maxTags);
        onChange(newTags);
        setInputValue("");
        return;
      }
    }
    
    setInputValue(inputValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[36px]" onClick={focusInput}>
        {value.map((tag, index) => (
          <div
            key={index}
            className="bg-[#141E33]/10 text-[#141E33] px-3 py-1 rounded-full flex items-center text-sm group"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(index);
              }}
              className="ml-1.5 text-gray-500 hover:text-[#141E33] focus:outline-none"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "E.g. life insurance, retirement planning" : placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => handleAddTag()}
          disabled={inputValue.trim() === "" || value.length >= maxTags}
          className="bg-[#141E33] hover:bg-[#1f2c49]"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      
      <div className="mt-2">
        <p className="text-xs text-gray-500 mb-2">
          {inputValue.trim() === "" ? "Suggested specializations:" : "Matching specializations:"}
        </p>
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.map(suggestion => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                handleAddTag(suggestion);
                if (inputRef.current) inputRef.current.focus();
              }}
              className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-gray-800 transition-colors"
            >
              {suggestion}
            </button>
          ))}
          
          {filteredSuggestions.length === 0 && inputValue.trim() !== "" && (
            <span className="text-xs text-gray-500">
              No matching specializations found. Type and add your custom specialization.
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Enter each specialization and press Enter or Add button. You can also paste multiple specializations separated by commas.
        {maxTags && ` (${value.length}/${maxTags})`}
      </p>
    </div>
  );
}