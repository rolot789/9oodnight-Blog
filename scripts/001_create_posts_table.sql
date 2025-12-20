-- Create posts table for the blog
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  read_time TEXT DEFAULT '5 min',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts (public blog)
CREATE POLICY "Allow public read access" ON posts FOR SELECT USING (true);

-- Allow anyone to insert posts (for now, no auth required)
CREATE POLICY "Allow public insert" ON posts FOR INSERT WITH CHECK (true);

-- Allow anyone to update posts (for now, no auth required)
CREATE POLICY "Allow public update" ON posts FOR UPDATE USING (true);

-- Allow anyone to delete posts (for now, no auth required)
CREATE POLICY "Allow public delete" ON posts FOR DELETE USING (true);

-- Insert sample posts
INSERT INTO posts (title, category, excerpt, content, image_url, read_time) VALUES
(
  'Playing with Prime Numbers',
  'Mathematics',
  'Exploring the fascinating world of prime number distributions and their applications in modern cryptography.',
  'Prime numbers have fascinated mathematicians for millennia. These fundamental building blocks of arithmetic continue to reveal new secrets, from the Riemann Hypothesis to modern encryption algorithms.

The distribution of prime numbers follows patterns that mathematicians are still working to fully understand. The Prime Number Theorem gives us an approximation, but the exact behavior remains one of mathematics'' greatest mysteries.

In cryptography, prime numbers form the backbone of RSA encryption. The difficulty of factoring large numbers into their prime components provides the security that protects our digital communications.

Recent advances in computational number theory have allowed us to discover ever-larger prime numbers, with the largest known primes now containing millions of digits.',
  '/abstract-mathematical-formulas-and-prime-numbers-o.jpg',
  '8 min'
),
(
  'Clean Code Architecture',
  'Development',
  'Best practices for writing maintainable, scalable code that stands the test of time.',
  'Writing clean code is more than just following style guidelines—it''s about creating software that communicates its intent clearly and can be maintained by others (including your future self).

The principles of clean architecture help us create systems that are independent of frameworks, testable without UI or database, and independent of any external agency.

Key principles include the Single Responsibility Principle, where each module should have one reason to change, and the Dependency Inversion Principle, where high-level modules should not depend on low-level modules.

By following these principles, we create codebases that are easier to understand, modify, and extend over time.',
  '/clean-code-on-dark-ide-with-algorithm-visualizatio.jpg',
  '6 min'
),
(
  'Cloud Infrastructure Patterns',
  'DevOps',
  'Modern approaches to building resilient, scalable cloud systems.',
  'Cloud infrastructure has evolved dramatically over the past decade. Today''s architects must consider not just scalability, but also resilience, security, and cost optimization.

Microservices architecture allows teams to develop, deploy, and scale services independently. Combined with containerization and orchestration platforms like Kubernetes, this approach provides unprecedented flexibility.

Infrastructure as Code (IaC) tools like Terraform and Pulumi enable version-controlled, reproducible infrastructure deployments. This approach reduces human error and enables rapid disaster recovery.

The shift to serverless computing represents the next evolution, allowing developers to focus purely on business logic while the cloud provider handles all infrastructure concerns.',
  '/cloud-infrastructure-diagram-with-servers-and-conn.jpg',
  '7 min'
),
(
  'Algorithm Optimization Techniques',
  'Computer Science',
  'Deep dive into algorithmic complexity and optimization strategies.',
  'Understanding algorithmic complexity is essential for writing efficient software. Big O notation provides a framework for analyzing how algorithms scale with input size.

Dynamic programming transforms exponential-time algorithms into polynomial-time solutions by storing and reusing intermediate results. This technique is fundamental to solving optimization problems efficiently.

Graph algorithms like Dijkstra''s shortest path and minimum spanning tree algorithms have applications far beyond computer science, from network routing to logistics optimization.

Modern hardware considerations, including cache efficiency and parallelization opportunities, add new dimensions to algorithm optimization that classical complexity analysis doesn''t capture.',
  '/minimal-workspace-with-laptop-and-mathematical-equ.jpg',
  '10 min'
);
