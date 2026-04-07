import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceProvisioner } from "./components/DeviceProvisioner";
import { DeviceCalibrator } from "./components/DeviceCalibrator";

export default function ProvisionPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Device Tools
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect a SmartFall device via USB to provision or calibrate it.
          </p>
        </div>

        <Tabs defaultValue="provision" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="provision">Provisioning</TabsTrigger>
            <TabsTrigger value="calibrate">Calibration</TabsTrigger>
          </TabsList>
          <TabsContent value="provision">
            <DeviceProvisioner />
          </TabsContent>
          <TabsContent value="calibrate">
            <DeviceCalibrator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
