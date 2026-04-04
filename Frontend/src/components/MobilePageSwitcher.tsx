import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, List, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwitcherOption {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface MobilePageSwitcherProps {
  options: SwitcherOption[];
  activeLabel?: string;
}

export default function MobilePageSwitcher({ options, activeLabel }: MobilePageSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeOption = options.find(opt => opt.path === location.pathname) || 
                       options.find(opt => opt.label === activeLabel) || 
                       options[0];

  return (
    <div className="lg:hidden mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between gap-2 px-4 py-6 rounded-2xl border-border bg-card/50 backdrop-blur-md shadow-sm hover:bg-accent/5 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10 text-accent">
                {activeOption.icon}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">View Mode</p>
                <p className="text-sm font-bold text-foreground">{activeOption.label}</p>
              </div>
            </div>
            <ChevronDown size={18} className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] p-2 rounded-[1.5rem] shadow-2xl border-border/50 backdrop-blur-xl">
          {options.map((option) => {
            const isActive = activeOption.path === option.path;
            return (
              <DropdownMenuItem
                key={option.path}
                onClick={() => navigate(option.path)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all mb-1 last:mb-0 ${
                  isActive 
                    ? 'bg-accent text-accent-foreground font-bold' 
                    : 'text-foreground hover:bg-muted font-medium'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-accent/10 text-accent'}`}>
                  {option.icon}
                </div>
                <span className="text-sm">{option.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-foreground" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
