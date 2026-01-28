'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, Bell, Search, User } from 'lucide-react';

interface CaregiverHeaderProps {
  firstName?: string;
  lastName?: string;
  facilityName?: string;
  alertCount?: number;
  onSearch: (query: string) => void;
  onLogout: () => void;
}

export const CaregiverHeader: React.FC<CaregiverHeaderProps> = ({
  firstName = 'Caregiver',
  lastName = '',
  facilityName = '',
  alertCount = 0,
  onSearch,
  onLogout
}) => {
  const initials = `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();

  return (
    <header className="bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#1a1a96]">SmartFall</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {firstName} {lastName}
            </p>
            {facilityName && (
              <p className="text-xs text-muted-foreground">
                {facilityName}
              </p>
            )}
          </div>

          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            {alertCount > 0 && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {alertCount}
                </Badge>
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#1a1a96] text-white text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
