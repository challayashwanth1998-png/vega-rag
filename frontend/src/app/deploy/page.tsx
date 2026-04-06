"use client";

import Link from "next/link";
import { useAuth } from "@/components/Providers";
import { Bot, CheckCircle2, Github, ArrowRight, Zap, Shield, Server, Terminal } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";

export default function DeployPage() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 selection:bg-blue-100">
      <MarketingNav />

      {/* ── Header ── */}
      <header className="py-24 text-center px-6 border-b border-slate-100 bg-slate-50">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest mb-6">
          <Zap className="w-3.5 h-3.5" /> Start Building
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 underline decoration-blue-500 decoration-4 underline-offset-8 uppercase italic font-black tracking-tighter">
          How to Deploy VegaRAG.
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-3xl mx-auto mb-10">
          VegaRAG gives you two choices: Test your exact usecase on our managed servers for free, or deploy the Open-Source engine to your own AWS account.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20 pb-40">

        {/* ── Route 1: SaaS Trial ── */}
        <section className="mb-24">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl isolate">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 opacity-20 blur-[150px] rounded-full -z-10" />

            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <span className="font-black text-blue-400">1</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight underline decoration-blue-500 decoration-4 underline-offset-8 uppercase italic font-black tracking-tighter">The 250k Token Trial</h2>
                </div>

                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  Don&apos;t want to mess with AWS configurations yet? You can build, configure, and stress-test your agents entirely on our hosted infrastructure. We cover the vector database and LLM compute costs up to your monthly token limit so you can prove your concept works first.
                </p>

                <ul className="space-y-4 mb-10 text-slate-300 font-medium">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Includes 250,000 Amazon Bedrock tokens per month</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> 100MB of Pinecone Vector storage</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> No credit card required to start</li>
                </ul>

                <button onClick={() => auth.signinRedirect()} className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                  <Bot className="w-5 h-5" /> Start Testing Instantly
                </button>
              </div>

              <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-10 md:pt-0 md:pl-12 w-full">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-sm text-green-400 leading-relaxed">
                  $ vegarag init <br />
                  <span className="text-slate-500">Initializing workspace...</span><br />
                  <span className="text-blue-400">Loading vector embeddings... [OK]</span><br />
                  &gt; User: How does VegaRAG work?<br />
                  &gt; Agent: I am routing your query to Amazon Bedrock Nova Micro. The embedding returned 3 chunks from your S3 bucket.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Route 2: Self Hosted AWS Stack ── */}
        <section>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
              <span className="font-black text-slate-500">2</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 underline decoration-blue-500 decoration-4 underline-offset-8 decoration-double uppercase italic font-black tracking-tighter">Self-Host Open Source</h2>
          </div>

          <p className="text-slate-500 text-lg leading-relaxed mb-12 max-w-3xl">
            Ready to push to production with absolute data privacy? The VegaRAG core repository contains frontend and backend Dockerfiles, allowing you to easily deploy on your own AWS infrastructure using Fargate.
          </p>
          <div className="max-w-4xl mx-auto relative">

            {/* Vertical Line connecting steps */}
            <div className="absolute left-[2.25rem] top-10 bottom-10 w-px bg-slate-200 hidden md:block" />

            <div className="space-y-16">

              {/* Step 1: Clone */}
              <div className="relative pl-0 md:pl-24">
                <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm z-10">
                  <span className="text-xl font-black text-slate-400">1</span>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                  <h3 className="text-2xl font-black mb-3">Clone the Open-Source Engine</h3>
                  <p className="text-slate-500 mb-6">Grab the latest version of the VegaRAG monorepo directly from GitHub. It includes both the Next.js frontend and the FastAPI backend.</p>
                  <pre className="bg-slate-900 text-slate-300 text-sm p-5 rounded-2xl overflow-x-auto font-mono">
                    <span className="select-none text-slate-600 mr-4">$</span>git clone https://github.com/challayashwanth1998-png/vega-rag.git{'\n'}
                    <span className="select-none text-slate-600 mr-4">$</span>cd vega-rag
                  </pre>
                </div>
              </div>

              {/* Step 2: ECR */}
              <div className="relative pl-0 md:pl-24">
                <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm z-10">
                  <span className="text-xl font-black text-slate-400">2</span>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                  <h3 className="text-2xl font-black mb-3">Containerize and Push to ECR</h3>
                  <p className="text-slate-500 mb-6">Use Docker to build your containers. Push both images securely to AWS Elastic Container Registry (ECR). </p>
                  <pre className="bg-slate-900 text-slate-300 text-sm p-5 rounded-2xl overflow-x-auto font-mono leading-loose">
                    <span className="text-blue-400"># Authenticate your terminal</span>{'\n'}
                    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin &lt;AWS_ACCOUNT_ID&gt;.dkr.ecr.us-east-1.amazonaws.com{'\n\n'}

                    <span className="text-blue-400"># Build mapping to the x86 Linux Fargate CPUs</span>{'\n'}
                    docker build --platform linux/amd64 -t vegarag-backend ./backend{'\n'}
                    docker tag vegarag-backend:latest &lt;AWS_ACCOUNT_ID&gt;.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest{'\n'}
                    docker push &lt;AWS_ACCOUNT_ID&gt;.dkr.ecr.us-east-1.amazonaws.com/vegarag-backend:latest
                  </pre>
                </div>
              </div>

              {/* Step 3: Infra */}
              <div className="relative pl-0 md:pl-24">
                <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm z-10">
                  <span className="text-xl font-black text-slate-400">3</span>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                  <h3 className="text-2xl font-black mb-3">Provision AWS Infrastructure</h3>
                  <p className="text-slate-500 mb-6">Initialize the multi-tenant DynamoDB state table and the secure S3 document vault.</p>
                  <pre className="bg-slate-900 text-slate-300 text-sm p-5 rounded-2xl overflow-x-auto font-mono leading-loose">
                    aws dynamodb create-table \{'\n'}
                    --table-name vegarag_table \{'\n'}
                    --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \{'\n'}
                    --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \{'\n'}
                    --billing-mode PAY_PER_REQUEST{'\n'}
                    {'\n'}
                    aws s3 mb s3://vegarag-documents-&lt;ID&gt; --region us-east-1
                  </pre>
                </div>
              </div>

              {/* Step 4: Parameter Store */}
              <div className="relative pl-0 md:pl-24">
                <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm z-10">
                  <span className="text-xl font-black text-slate-400">4</span>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                  <h3 className="text-2xl font-black mb-3">Configure Parameter Store</h3>
                  <p className="text-slate-500 mb-6">Store your Pinecone and AWS configurations securely in the Systems Manager (SSM) Parameter Store to inject them into the ECS Tasks.</p>
                  <pre className="bg-slate-900 text-slate-300 text-sm p-5 rounded-2xl overflow-x-auto font-mono leading-loose">
                    aws ssm put-parameter --name "/vegarag/prod/pinecone_api_key" --value "your-pinecone-key" --type "SecureString"{'\n'}
                    aws ssm put-parameter --name "/vegarag/prod/pinecone_index" --value "vegarag-index" --type "String"{'\n'}
                    aws ssm put-parameter --name "/vegarag/prod/s3_bucket" --value "vegarag-documents-&lt;ID&gt;" --type "String"
                  </pre>
                </div>
              </div>

              {/* Step 5: Security */}
              <div className="relative pl-0 md:pl-24">
                <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm z-10">
                  <span className="text-xl font-black text-slate-400">5</span>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                  <h3 className="text-2xl font-black mb-3">Apply IAM Security Policies</h3>
                  <p className="text-slate-500 mb-6">Never hardcode AWS keys in your <code>.env</code> file. Create an Execution Role allowing Fargate to natively call Bedrock APIs.</p>
                  <pre className="bg-slate-900 text-emerald-400 text-sm p-5 rounded-2xl overflow-x-auto font-mono leading-loose">
                    aws iam create-role --role-name vegaragTaskRole \{'\n'}
                    --assume-role-policy-document file://ecs-trust-policy.json{'\n'}
                    {'\n'}
                    aws iam attach-role-policy --role-name vegaragTaskRole \{'\n'}
                    --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
                  </pre>
                </div>
              </div>

              {/* Step 6: ALB */}
              <div className="relative pl-0 md:pl-24">
                <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-sm z-10">
                  <span className="text-xl font-black text-slate-400">6</span>
                </div>
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                  <h3 className="text-2xl font-black mb-3">Route with a Load Balancer</h3>
                  <p className="text-slate-500 mb-6">Since the React frontend is on port 3000 and FastAPI on 8000, use an Application Load Balancer to unify them on one domain.</p>
                  <pre className="bg-slate-900 text-slate-300 text-sm p-5 rounded-2xl overflow-x-auto font-mono leading-loose">
                    <span className="text-blue-400"># Map all API calls to the python backend</span>{'\n'}
                    aws elbv2 create-rule --listener-arn &lt;LISTENER_ARN&gt; --priority 10 \{'\n'}
                    --conditions Field=path-pattern,Values='/api/*' \{'\n'}
                    --actions Type=forward,TargetGroupArn=&lt;BACKEND_TG_ARN&gt;
                  </pre>
                </div>
              </div>

              {/* Step 7: Launch */}
              <div className="relative pl-0 md:pl-24">
                <div className="hidden md:flex absolute left-0 top-0 w-16 h-16 bg-blue-600 border border-blue-500 rounded-2xl items-center justify-center shadow-sm z-10">
                  <span className="text-xl font-black text-white">7</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl shadow-sm transition">
                  <h3 className="text-2xl font-black text-blue-950 mb-3">Launch on Fargate</h3>
                  <p className="text-blue-800 mb-6 font-medium">Inject your containers into the cloud. AWS ECS automatically handles scaling and health checks.</p>
                  <pre className="bg-slate-900 text-blue-300 text-sm p-5 rounded-2xl overflow-x-auto font-mono leading-loose">
                    aws ecs create-service \{'\n'}
                    --cluster vegarag-cluster \{'\n'}
                    --service-name vegarag-backend-svc \{'\n'}
                    --task-definition vegarag-backend-task \{'\n'}
                    --launch-type FARGATE \{'\n'}
                    --network-configuration "awsvpcConfiguration=..."
                  </pre>
                </div>
              </div>

            </div>

            <div className="mt-16 text-center">
              <a href="https://github.com/challayashwanth1998-png/vega-rag" target="_blank" className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white font-black px-10 py-5 rounded-2xl hover:bg-slate-800 transition shadow-xl hover:-translate-y-1">
                <Github className="w-6 h-6" /> View Open Source Repository on GitHub
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-12 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} VegaRAG Open Source</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-blue-600 transition">Back to Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
