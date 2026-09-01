"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketplaceCategory, MarketplaceLocation } from "@/lib/api";

/**
 * Browse before you commit to a form: two pickers, no name or email, straight
 * into the results page.
 */
export function HeroSearch({
  categories,
  locations,
}: {
  categories: MarketplaceCategory[];
  locations: MarketplaceLocation[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(
    categories[0]?.slug ?? "plumber",
  );
  const [location, setLocation] = useState<string>(
    locations[0]?.slug ?? "naas",
  );

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/find/${category}/${location}`);
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="hero-trade" className="field-label">
          What do you need?
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="hero-trade" className="w-full">
            <SelectValue placeholder="Pick a trade" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="hero-location" className="field-label">
          Where?
        </Label>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger id="hero-location" className="w-full">
            <SelectValue placeholder="Pick a town" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.town}, Co. {item.county}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <span aria-hidden className="hidden text-xs sm:block">
          &nbsp;
        </span>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <Search />
          Search
        </Button>
      </div>
    </form>
  );
}
