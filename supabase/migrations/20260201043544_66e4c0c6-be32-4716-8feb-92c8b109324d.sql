-- Create semboyan table for storing railway signal data
CREATE TABLE public.semboyan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  gambar TEXT DEFAULT '',
  sifat TEXT NOT NULL CHECK (sifat IN ('Sementara', 'Tetap', 'Khusus')),
  status TEXT NOT NULL CHECK (status IN ('Aktif', 'Tidak Aktif')),
  penjelasan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.semboyan ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (data is public for Roblox to fetch)
CREATE POLICY "Anyone can read semboyan" 
ON public.semboyan 
FOR SELECT 
USING (true);

-- Create policy for public insert (for apps without auth)
CREATE POLICY "Anyone can insert semboyan" 
ON public.semboyan 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update
CREATE POLICY "Anyone can update semboyan" 
ON public.semboyan 
FOR UPDATE 
USING (true);

-- Create policy for public delete
CREATE POLICY "Anyone can delete semboyan" 
ON public.semboyan 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_semboyan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_semboyan_timestamp
BEFORE UPDATE ON public.semboyan
FOR EACH ROW
EXECUTE FUNCTION public.update_semboyan_updated_at();

-- Enable realtime for semboyan table
ALTER PUBLICATION supabase_realtime ADD TABLE public.semboyan;