"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Battery, Droplets, Thermometer } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

// Define the structure of our sensor data
interface SensorData {
  received_at: string;
  ADC_CH0V: number;
  BatV: number;
  Digital_IStatus: string;
  Door_status: string;
  EXTI_Trigger: string;
  Hum_SHT: number;
  TempC1: number;
  TempC_SHT: number;
  Work_mode: string;
}

// Define the structure of our chart data point
interface ChartDataPoint {
  time: string;
  BatV: number;
  Hum_SHT: number;
  TempC_SHT: number;
}

const MAX_DATA_POINTS = 20; // Limit the number of data points to display
// const POLLING_INTERVAL = 5 * 60 * 1010; // 6 minutes in milliseconds
const POLLING_INTERVAL = 62 * 1000; // 1.002 minute in milliseconds

export default function SensorDataCard(): JSX.Element {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<{
    temp: { value: number; increasing: boolean },
    humidity: { value: number; increasing: boolean },
    battery: { value: number; increasing: boolean }
  }>({
    temp: { value: 0, increasing: false },
    humidity: { value: 0, increasing: false },
    battery: { value: 0, increasing: false }
  });

  const fetchSensorData = async () => {
    try {
      const response = await fetch('/api/data');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data: SensorData = await response.json();
      const timestamp = new Date(data.received_at);
      const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Create a new data point
      const newDataPoint: ChartDataPoint = {
        time: timeStr,
        BatV: data.BatV,
        Hum_SHT: data.Hum_SHT,
        TempC_SHT: data.TempC_SHT,
      };

      // Update chart data, keeping only the latest MAX_DATA_POINTS
      setChartData((prevData) => {
        const updatedData = [...prevData, newDataPoint];
        
        // Calculate trends if we have at least 2 data points
        if (updatedData.length >= 2) {
          const current = updatedData[updatedData.length - 1];
          const previous = updatedData[updatedData.length - 2];
          
          const tempChange = ((current.TempC_SHT - previous.TempC_SHT) / previous.TempC_SHT) * 100;
          const humChange = ((current.Hum_SHT - previous.Hum_SHT) / previous.Hum_SHT) * 100;
          const batChange = ((current.BatV - previous.BatV) / previous.BatV) * 100;
          
          setTrendData({
            temp: { 
              value: Math.abs(tempChange), 
              increasing: tempChange > 0 
            },
            humidity: { 
              value: Math.abs(humChange), 
              increasing: humChange > 0 
            },
            battery: { 
              value: Math.abs(batChange), 
              increasing: batChange > 0 
            }
          });
        }
        console.log("Updated chart data:", updatedData);
        
        if (updatedData.length > MAX_DATA_POINTS) {
          return updatedData.slice(updatedData.length - MAX_DATA_POINTS);
        }
        return updatedData;
      });

      setLastUpdate(timestamp.toLocaleString());
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error("Error fetching sensor data:", err);
      setIsConnected(false);
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => {
    // Initial fetch when component mounts
    fetchSensorData();

    // Set up polling interval
    const intervalId = setInterval(fetchSensorData, POLLING_INTERVAL);

    // Clean up on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Define chart configuration
  const chartConfig: ChartConfig = {
    temperature: {
      label: "Temperature",
      color: "hsl(var(--chart-1))",
    },
    humidity: {
      label: "Humidity",
      color: "hsl(var(--chart-2))",
    },
    battery: {
      label: "Battery",
      color: "hsl(var(--chart-3))",
    },
  };

  // Function to get trend icon
  const getTrendIcon = (increasing: boolean, size = 16) => {
    return increasing ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Get current time for the card description
  const getCurrentTimeRange = () => {
    if (chartData.length < 2) return "Waiting for data...";
    const firstPoint = chartData[0].time;
    const lastPoint = chartData[chartData.length - 1].time;
    return `${firstPoint} - ${lastPoint}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sensor Data</CardTitle>
            <CardDescription>{getCurrentTimeRange()}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          {chartData.length > 0 ? (
            <LineChart
              data={chartData}
              margin={{
                left: 0,
                right: 20,
                top: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={[20, 40]}
                hide
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[3, 4]}
                hide
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Line
                type="monotone"
                dataKey="TempC_SHT"
                stroke="var(--color-temperature)"
                name="Temperature"
                yAxisId="left"
                dot={true}
                activeDot={{ r: 4 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Hum_SHT"
                stroke="var(--color-humidity)"
                name="Humidity"
                yAxisId="left"
                dot={true}
                activeDot={{ r: 4 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="BatV"
                stroke="var(--color-battery)"
                name="Battery"
                yAxisId="right"
                dot={true}
                activeDot={{ r: 4 }}
                strokeWidth={2}
              />
            </LineChart>
          ) : (
            <div className="flex h-48 items-center justify-center border border-dashed rounded-md bg-muted/20">
              <p className="text-muted-foreground">Waiting for data...</p>
            </div>
          )}
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {chartData.length > 1 ? (
          <>
            <div className="grid grid-cols-3 w-full gap-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-rose-500" />
                <span className="font-medium">{chartData[chartData.length - 1].TempC_SHT.toFixed(1)}°C</span>
                {/* <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(trendData.temp.increasing)}
                  <span className={trendData.temp.increasing ? "text-green-500" : "text-red-500"}>
                    {trendData.temp.value.toFixed(1)}%
                  </span>
                </div> */}
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{chartData[chartData.length - 1].Hum_SHT.toFixed(1)}%</span>
                {/* <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(trendData.humidity.increasing)}
                  <span className={trendData.humidity.increasing ? "text-green-500" : "text-red-500"}>
                    {trendData.humidity.value.toFixed(1)}%
                  </span>
                </div> */}
              </div>
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-green-500" />
                <span className="font-medium">{chartData[chartData.length - 1].BatV.toFixed(2)}V</span>
                {/* <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(trendData.battery.increasing)}
                  <span className={trendData.battery.increasing ? "text-green-500" : "text-red-500"}>
                    {trendData.battery.value.toFixed(1)}%
                  </span>
                </div> */}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Last update: {lastUpdate} (Updates every 6 minutes)
            </div>
          </>
        ) : (
          <div className="text-muted-foreground">Waiting for data to show trends...</div>
        )}
        {error && (
          <div className="text-xs text-red-500 mt-1">
            {error}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}