import WorkflowStatus from '@/components/WorkflowStatus';
import { WorkflowStatusTrail } from '@/components/WorkflowStatusTrail';
import { CompactWorkflowTrail } from '@/components/CompactWorkflowTrail';

export default function WorkflowDemo() {
  const statuses = ['submitted', 'under_review', 'approved', 'disbursed'];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Workflow Status Components</h1>
          <p className="text-muted-foreground">Different variants of workflow status display</p>
        </div>

        {/* Horizontal Trail - Full Width */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Horizontal Trail (Full)</h2>
          <div className="space-y-6">
            {statuses.map(status => (
              <div key={status} className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-medium mb-4 capitalize">{status.replace('_', ' ')} Status</h3>
                <WorkflowStatusTrail currentStatus={status} />
              </div>
            ))}
          </div>
        </section>

        {/* Compact Trail */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Compact Trail</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statuses.map(status => (
              <div key={status} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                  <CompactWorkflowTrail currentStatus={status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Status Component Variants */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">WorkflowStatus Component Variants</h2>
          
          {/* Horizontal Variant */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Horizontal Variant</h3>
            <WorkflowStatus currentStatus="under_review" variant="horizontal" />
          </div>

          {/* Compact Variant */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Compact Variant</h3>
            <div className="bg-card rounded-lg border border-border p-4">
              <WorkflowStatus currentStatus="approved" variant="compact" />
            </div>
          </div>

          {/* Vertical Variant (Original) */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Vertical Variant (Original)</h3>
            <div className="max-w-md">
              <WorkflowStatus currentStatus="disbursed" variant="vertical" />
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Usage Examples</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card with Horizontal Trail */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Loan Application #CL-2026-001</h3>
                <span className="text-sm text-muted-foreground">₹12,50,000</span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Applicant: John Doe</p>
                <p className="text-sm text-muted-foreground">Car: Maruti Suzuki Brezza</p>
              </div>
              <WorkflowStatusTrail currentStatus="approved" />
            </div>

            {/* Card with Compact Trail */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Loan Application #CL-2026-002</h3>
                <span className="text-sm text-muted-foreground">₹8,75,000</span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Applicant: Jane Smith</p>
                <p className="text-sm text-muted-foreground">Car: Hyundai Creta</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Status:</span>
                <CompactWorkflowTrail currentStatus="under_review" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}