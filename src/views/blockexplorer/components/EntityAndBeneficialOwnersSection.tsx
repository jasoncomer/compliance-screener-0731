import React from 'react';

import { Building, Users } from 'lucide-react';

const EntityAndBeneficialOwnersSection: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-6">
    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-3 mx-auto">
        <Building className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
      </div>
      <h3 className="font-medium text-foreground mb-2">Entity Intelligence</h3>
      <p className="text-sm text-muted-foreground">
        Explore entity relationships and corporate structures
      </p>
    </div>

    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3 mx-auto">
        <Users className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
      </div>
      <h3 className="font-medium text-foreground mb-2">Beneficial Owners</h3>
      <p className="text-sm text-muted-foreground">
        Identify ultimate beneficial owners and control structures
      </p>
    </div>
  </div>
);

export default EntityAndBeneficialOwnersSection;