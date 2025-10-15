"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Package,
  Settings,
  BarChart3,
  Plus,
  Trash2,
  FileText,
  Target,
  MapPin,
  Edit,
} from "lucide-react";

interface CustomQuestion {
  id: string;
  label: string;
  type: "text" | "number" | "dropdown" | "radio" | "checkbox";
  options?: string[];
  required: boolean;
  placeholder?: string;
}

interface Component {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  benefits: string[];
  eligibilityCriteria: {
    minAge?: number;
    maxAge?: number;
    minLandHolding?: number;
    minAnimalCount?: number;
  };
  customQuestions: CustomQuestion[];
  documentRequirements: string[];
  quotas: {
    district: string;
    quota: number;
    utilized: number;
  }[];
  applicationGuidelines: string;
  totalApplications: number;
  approvedApplications: number;
}

export default function AdminComponents() {
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("config");

  const [components, setComponents] = useState<Component[]>([
    {
      id: 1,
      name: "Animal Induction (Calved Cow)",
      description: "Financial assistance for purchasing quality dairy cattle",
      isActive: true,
      benefits: [
        "50% subsidy up to ₹30,000",
        "Quality breeding stock",
        "Veterinary support for 6 months",
      ],
      eligibilityCriteria: {
        minAge: 18,
        maxAge: 60,
        minLandHolding: 0.5,
        minAnimalCount: 1,
      },
      customQuestions: [
        {
          id: "q1",
          label: "Select Breed Type",
          type: "dropdown",
          options: ["Cross Breed Cow", "Desi Cow", "Buffalo"],
          required: true,
        },
        {
          id: "q2",
          label: "Animal Tag Number",
          type: "text",
          required: true,
          placeholder: "Enter tag number",
        },
      ],
      documentRequirements: [
        "Aadhar Card",
        "Ration Card",
        "Land Records (7/12)",
        "Animal Health Certificate",
        "Bank Passbook",
      ],
      quotas: [
        { district: "Nagpur", quota: 500, utilized: 234 },
        { district: "Amravati", quota: 400, utilized: 189 },
        { district: "Akola", quota: 350, utilized: 156 },
      ],
      applicationGuidelines: "Applicants must have adequate shelter and feeding facilities. Priority given to first-time applicants.",
      totalApplications: 579,
      approvedApplications: 342,
    },
    {
      id: 2,
      name: "HGM Purchase",
      description: "Subsidy for purchasing Hybrid Germplasm Material",
      isActive: true,
      benefits: [
        "40% subsidy on HGM cost",
        "Free veterinary consultation",
        "Training on artificial insemination",
      ],
      eligibilityCriteria: {
        minAge: 21,
        maxAge: 65,
        minAnimalCount: 2,
      },
      customQuestions: [],
      documentRequirements: [
        "Aadhar Card",
        "Existing animal records",
        "Veterinary registration",
      ],
      quotas: [
        { district: "Nagpur", quota: 300, utilized: 145 },
        { district: "Yavatmal", quota: 250, utilized: 98 },
      ],
      applicationGuidelines: "Only for registered dairy farmers with active veterinary supervision.",
      totalApplications: 243,
      approvedApplications: 198,
    },
  ]);

  const [editForm, setEditForm] = useState<Component | null>(null);
  const [newQuestion, setNewQuestion] = useState<CustomQuestion>({
    id: "",
    label: "",
    type: "text",
    required: false,
  });

  const handleEditComponent = (component: Component) => {
    setSelectedComponent(component);
    setEditForm({ ...component });
    setShowEditDialog(true);
  };

  const handleAddComponent = () => {
    const newComponent: Component = {
      id: components.length + 1,
      name: "",
      description: "",
      isActive: true,
      benefits: [],
      eligibilityCriteria: {},
      customQuestions: [],
      documentRequirements: [],
      quotas: [],
      applicationGuidelines: "",
      totalApplications: 0,
      approvedApplications: 0,
    };
    setEditForm(newComponent);
    setShowAddDialog(true);
  };

  const handleSaveNewComponent = () => {
    if (editForm) {
      setComponents([...components, editForm]);
      setShowAddDialog(false);
      setEditForm(null);
    }
  };

  const handleAddBenefit = () => {
    if (editForm) {
      setEditForm({
        ...editForm,
        benefits: [...editForm.benefits, ""],
      });
    }
  };

  const handleUpdateBenefit = (index: number, value: string) => {
    if (editForm) {
      const newBenefits = [...editForm.benefits];
      newBenefits[index] = value;
      setEditForm({ ...editForm, benefits: newBenefits });
    }
  };

  const handleRemoveBenefit = (index: number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        benefits: editForm.benefits.filter((_, i) => i !== index),
      });
    }
  };

  const handleAddQuestion = () => {
    if (editForm && newQuestion.label) {
      const question = {
        ...newQuestion,
        id: `q${Date.now()}`,
      };
      setEditForm({
        ...editForm,
        customQuestions: [...editForm.customQuestions, question],
      });
      setNewQuestion({
        id: "",
        label: "",
        type: "text",
        required: false,
      });
    }
  };

  const handleRemoveQuestion = (questionId: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        customQuestions: editForm.customQuestions.filter((q) => q.id !== questionId),
      });
    }
  };

  const handleAddQuota = () => {
    if (editForm) {
      setEditForm({
        ...editForm,
        quotas: [...editForm.quotas, { district: "", quota: 0, utilized: 0 }],
      });
    }
  };

  const handleUpdateQuota = (index: number, field: string, value: string | number) => {
    if (editForm) {
      const newQuotas = [...editForm.quotas];
      newQuotas[index] = { ...newQuotas[index], [field]: value };
      setEditForm({ ...editForm, quotas: newQuotas });
    }
  };

  const handleRemoveQuota = (index: number) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        quotas: editForm.quotas.filter((_, i) => i !== index),
      });
    }
  };

  const handleSaveComponent = () => {
    if (editForm) {
      setComponents(
        components.map((c) => (c.id === editForm.id ? editForm : c))
      );
      setShowEditDialog(false);
      setEditForm(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar userRole="admin" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-background">
          <div>
            <h1 className="font-display font-semibold text-xl" data-testid="text-components-title">
              Component Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage scheme components and configurations
            </p>
          </div>
          <Button className="gap-2" onClick={handleAddComponent} data-testid="button-add-component">
            <Plus className="w-4 h-4" />
            Add Component
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <div className="space-y-6 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Components</p>
                      <p className="font-display font-bold text-2xl">{components.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-chart-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Schemes</p>
                      <p className="font-display font-bold text-2xl">
                        {components.filter((c) => c.isActive).length}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-chart-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
                      <p className="font-display font-bold text-2xl">
                        {components.reduce((sum, c) => sum + c.totalApplications, 0)}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-chart-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {components.map((component, index) => (
                <Card
                  key={component.id}
                  className="hover-elevate transition-all"
                  data-testid={`component-card-${index}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{component.name}</CardTitle>
                          <Badge
                            variant={component.isActive ? "default" : "secondary"}
                            className={component.isActive ? "bg-chart-3" : ""}
                          >
                            {component.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardDescription>{component.description}</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditComponent(component)}
                        data-testid={`button-edit-${index}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Applications</p>
                        <p className="font-semibold">{component.totalApplications}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Approved</p>
                        <p className="font-semibold">{component.approvedApplications}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Benefits</p>
                        <p className="font-semibold">{component.benefits.length} defined</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Questions</p>
                        <p className="font-semibold">{component.customQuestions.length} custom</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>

      {showEditDialog && editForm && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Package className="w-5 h-5" />
                Edit Component: {editForm.name}
              </DialogTitle>
              <DialogDescription>
                Configure scheme settings, eligibility, and quotas
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="config" data-testid="tab-config">Configuration</TabsTrigger>
                <TabsTrigger value="eligibility" data-testid="tab-eligibility">Eligibility</TabsTrigger>
                <TabsTrigger value="quotas" data-testid="tab-quotas">Quotas</TabsTrigger>
                <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                <TabsTrigger value="monitoring" data-testid="tab-monitoring">Monitoring</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Component Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable this scheme for farmers
                    </p>
                  </div>
                  <Switch
                    checked={editForm.isActive}
                    onCheckedChange={(checked) =>
                      setEditForm({ ...editForm, isActive: checked })
                    }
                    data-testid="switch-active"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Benefits / Services</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddBenefit}
                      data-testid="button-add-benefit"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Benefit
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editForm.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={benefit}
                          onChange={(e) => handleUpdateBenefit(index, e.target.value)}
                          placeholder="Enter benefit description"
                          data-testid={`input-benefit-${index}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBenefit(index)}
                          data-testid={`button-remove-benefit-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="eligibility" className="space-y-4 mt-4">
                <div className="space-y-4 p-4 border rounded-lg">
                  <Label className="text-base font-semibold">Basic Eligibility Criteria</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Age</Label>
                      <Input
                        type="number"
                        value={editForm.eligibilityCriteria.minAge || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            eligibilityCriteria: {
                              ...editForm.eligibilityCriteria,
                              minAge: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        data-testid="input-min-age"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Age</Label>
                      <Input
                        type="number"
                        value={editForm.eligibilityCriteria.maxAge || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            eligibilityCriteria: {
                              ...editForm.eligibilityCriteria,
                              maxAge: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        data-testid="input-max-age"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Land Holding (acres)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.eligibilityCriteria.minLandHolding || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            eligibilityCriteria: {
                              ...editForm.eligibilityCriteria,
                              minLandHolding: parseFloat(e.target.value) || undefined,
                            },
                          })
                        }
                        data-testid="input-min-land"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Animal Count</Label>
                      <Input
                        type="number"
                        value={editForm.eligibilityCriteria.minAnimalCount || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            eligibilityCriteria: {
                              ...editForm.eligibilityCriteria,
                              minAnimalCount: parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                        data-testid="input-min-animals"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Custom Questions</Label>
                  </div>
                  
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <Label>Add New Question</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Question label"
                        value={newQuestion.label}
                        onChange={(e) => setNewQuestion({ ...newQuestion, label: e.target.value })}
                        data-testid="input-question-label"
                      />
                      <Select
                        value={newQuestion.type}
                        onValueChange={(value: any) => setNewQuestion({ ...newQuestion, type: value })}
                      >
                        <SelectTrigger data-testid="select-question-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Input</SelectItem>
                          <SelectItem value="number">Number Input</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                          <SelectItem value="radio">Radio Buttons</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(newQuestion.type === "dropdown" || newQuestion.type === "radio") && (
                      <Input
                        placeholder="Options (comma separated)"
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            options: e.target.value.split(",").map((s) => s.trim()),
                          })
                        }
                        data-testid="input-question-options"
                      />
                    )}
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newQuestion.required}
                          onCheckedChange={(checked) =>
                            setNewQuestion({ ...newQuestion, required: checked })
                          }
                          data-testid="switch-question-required"
                        />
                        <Label>Required</Label>
                      </div>
                      <Button onClick={handleAddQuestion} size="sm" data-testid="button-add-question">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Question
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {editForm.customQuestions.map((question, index) => (
                      <div
                        key={question.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`question-${index}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{question.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Type: {question.type} • {question.required ? "Required" : "Optional"}
                            {question.options && ` • Options: ${question.options.join(", ")}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(question.id)}
                          data-testid={`button-remove-question-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quotas" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">District-wise Quotas</Label>
                  <Button variant="outline" size="sm" onClick={handleAddQuota} data-testid="button-add-quota">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Quota
                  </Button>
                </div>
                <div className="space-y-2">
                  {editForm.quotas.map((quota, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                      <Select
                        value={quota.district}
                        onValueChange={(value) => handleUpdateQuota(index, "district", value)}
                      >
                        <SelectTrigger data-testid={`select-quota-district-${index}`}>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nagpur">Nagpur</SelectItem>
                          <SelectItem value="Amravati">Amravati</SelectItem>
                          <SelectItem value="Akola">Akola</SelectItem>
                          <SelectItem value="Yavatmal">Yavatmal</SelectItem>
                          <SelectItem value="Wardha">Wardha</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Quota"
                        value={quota.quota}
                        onChange={(e) =>
                          handleUpdateQuota(index, "quota", parseInt(e.target.value) || 0)
                        }
                        data-testid={`input-quota-${index}`}
                      />
                      <Input
                        type="number"
                        placeholder="Utilized"
                        value={quota.utilized}
                        onChange={(e) =>
                          handleUpdateQuota(index, "utilized", parseInt(e.target.value) || 0)
                        }
                        data-testid={`input-utilized-${index}`}
                        disabled
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuota(index)}
                        data-testid={`button-remove-quota-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Component Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    data-testid="textarea-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Application Guidelines</Label>
                  <Textarea
                    value={editForm.applicationGuidelines}
                    onChange={(e) =>
                      setEditForm({ ...editForm, applicationGuidelines: e.target.value })
                    }
                    rows={4}
                    data-testid="textarea-guidelines"
                  />
                </div>
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Total Applications</p>
                      <p className="font-display font-bold text-3xl">{editForm.totalApplications}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Approved</p>
                      <p className="font-display font-bold text-3xl">{editForm.approvedApplications}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">District-wise Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {editForm.quotas.map((quota, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium">{quota.district}</span>
                            <span className="text-muted-foreground">
                              {quota.utilized} / {quota.quota}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${(quota.utilized / quota.quota) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveComponent} data-testid="button-save">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showAddDialog && editForm && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Plus className="w-5 h-5" />
                Add New Component
              </DialogTitle>
              <DialogDescription>
                Create a new scheme component for the dairy programme
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Component Name *</Label>
                  <Input
                    placeholder="Enter component name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    data-testid="input-component-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Switch
                      checked={editForm.isActive}
                      onCheckedChange={(checked) =>
                        setEditForm({ ...editForm, isActive: checked })
                      }
                      data-testid="switch-new-active"
                    />
                    <Label>{editForm.isActive ? "Active" : "Inactive"}</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Enter component description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  data-testid="textarea-new-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Application Guidelines</Label>
                <Textarea
                  placeholder="Enter application guidelines"
                  value={editForm.applicationGuidelines}
                  onChange={(e) =>
                    setEditForm({ ...editForm, applicationGuidelines: e.target.value })
                  }
                  rows={3}
                  data-testid="textarea-new-guidelines"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveNewComponent}
                  disabled={!editForm.name || !editForm.description}
                  data-testid="button-save-new"
                >
                  Create Component
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
