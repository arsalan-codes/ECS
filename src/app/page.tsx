'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSensorData } from '@/services/sensor';
import { Icons } from '@/components/icons';
import { useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { getFanSpeed, setFanSpeed } from '@/services/fan';
import { getLightStatus, setLightStatus } from '@/services/lights';
import { analyzeSensorData } from '@/ai/flows/analyze-sensor-data';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import {
  Chart,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const chartConfig = {
  temperature: {
    label: "Temperature (°C)",
    color: "hsl(var(--chart-1))",
  },
  humidity: {
    label: "Humidity (%)",
    color: "hsl(var(--chart-2))",
  },
  oxygen: {
    label: "Oxygen (%)",
    color: "hsl(var(--chart-3))",
  },
};

function Sensors({ temperature, humidity, oxygen }: { temperature: number, humidity: number, oxygen: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Temperature</CardTitle>
          <CardDescription>Current temperature in Celsius</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Icons.thermometer className="h-4 w-4" />
            {temperature}°C
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Humidity</CardTitle>
          <CardDescription>Current humidity percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Icons.wind className="h-4 w-4" />
            {humidity}%
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Oxygen</CardTitle>
          <CardDescription>Current oxygen level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Icons.wind className="h-4 w-4" />
            {oxygen}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [oxygen, setOxygen] = useState<number>(0);
  const [fanSpeed, setFanSpeedState] = useState<number>(0);
  const [lightStatus, setLightStatusState] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<{ recommendedFanSpeed: number; explanation: string; } | null>(null);
  const { toast } = useToast();
    const [historicalData, setHistoricalData] = useState([
        { time: '00:00', temperature: 22, humidity: 60, oxygen: 95 },
        { time: '03:00', temperature: 23, humidity: 62, oxygen: 94 },
        { time: '06:00', temperature: 24, humidity: 64, oxygen: 93 },
        { time: '09:00', temperature: 23, humidity: 63, oxygen: 94 },
        { time: '12:00', temperature: 25, humidity: 65, oxygen: 92 },
        { time: '15:00', temperature: 26, humidity: 66, oxygen: 91 },
        { time: '18:00', temperature: 24, humidity: 64, oxygen: 93 },
        { time: '21:00', temperature: 23, humidity: 63, oxygen: 94 },
        { time: '24:00', temperature: 22, humidity: 61, oxygen: 95 },
    ]);


  useEffect(() => {
    const fetchData = async () => {
      const sensorData = await getSensorData();
      setTemperature(sensorData.temperatureCelsius);
      setHumidity(sensorData.humidity);
      setOxygen(sensorData.oxygen);

      const fanSettings = await getFanSpeed();
      setFanSpeedState(fanSettings.speed);

      const lightSettings = await getLightStatus();
      setLightStatusState(lightSettings.isOn);

      const aiOutput = await analyzeSensorData({});
      setAiRecommendation(aiOutput);
    };

    fetchData();
  }, []);

  const handleFanSpeedChange = async (value: number[]) => {
    const newSpeed = value[0];
    setFanSpeedState(newSpeed);
    await setFanSpeed({ speed: newSpeed });
    toast({
      title: "Fan speed updated.",
      description: `Fan speed set to ${newSpeed}%.`,
    });
  };

  const handleLightStatusChange = async (checked: boolean) => {
    setLightStatusState(checked);
    await setLightStatus({ isOn: checked });
    toast({
      title: "Light status updated.",
      description: `Lights ${checked ? 'turned on' : 'turned off'}.`,
    });
  };


  const avgTemperature = historicalData.reduce((acc, data) => acc + data.temperature, 0) / historicalData.length;
  const avgHumidity = historicalData.reduce((acc, data) => acc + data.humidity, 0) / historicalData.length;
  const avgOxygen = historicalData.reduce((acc, data) => acc + data.oxygen, 0) / historicalData.length;

  return (
    <div className="flex flex-col p-4 gap-4">
      <Toaster />

      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Overview of sensor data</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Average Temperature: {avgTemperature.toFixed(2)}°C, Average Humidity: {avgHumidity.toFixed(2)}%, Average Oxygen: {avgOxygen.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

        <Card>
            <CardHeader>
                <CardTitle>Sensors</CardTitle>
                <CardDescription>Real-time sensor data</CardDescription>
            </CardHeader>
            <CardContent>
                <Sensors temperature={temperature} humidity={humidity} oxygen={oxygen} />
            </CardContent>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Fan Speed Control</CardTitle>
            <CardDescription>Adjust the fan speed manually</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Slider
                defaultValue={[fanSpeed]}
                max={100}
                step={1}
                onValueChange={handleFanSpeedChange}
              />
              <p>Current speed: {fanSpeed}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lighting Control</CardTitle>
            <CardDescription>Turn lights on or off remotely</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Lights are: {lightStatus ? 'On' : 'Off'}</span>
              <Switch checked={lightStatus} onCheckedChange={handleLightStatusChange} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Optimization</CardTitle>
          <CardDescription>AI recommendation for optimal fan speed</CardDescription>
        </CardHeader>
        <CardContent>
          {aiRecommendation ? (
            <div className="flex flex-col gap-2">
              <Badge variant="secondary">Recommended Fan Speed: {aiRecommendation.recommendedFanSpeed}%</Badge>
              <p>{aiRecommendation.explanation}</p>
            </div>
          ) : (
            <p>Loading AI recommendation...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historical Data Visualization</CardTitle>
          <CardDescription>Visual representation of sensor data over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <AreaChart data={historicalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="temperature" stroke={chartConfig.temperature.color} fillOpacity={0.5} fill={chartConfig.temperature.color} />
              <Area type="monotone" dataKey="humidity" stroke={chartConfig.humidity.color} fillOpacity={0.5} fill={chartConfig.humidity.color} />
              <Area type="monotone" dataKey="oxygen" stroke={chartConfig.oxygen.color} fillOpacity={0.5} fill={chartConfig.oxygen.color} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
