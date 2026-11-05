"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  Check,
  CloudUpload,
  ExternalLink,
  FileArchive,
  FileImage,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { IntegrationNotice } from "@/components/integration-notice";
import { uploadFile, uploadMetadata } from "@/lib/api";
import type { ModelMetadata, UploadResponse } from "@/types/api";

type UploadResult = UploadResponse["data"];

export default function PublishPage() {
  const { publicKey, connected } = useWallet();
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modelResult, setModelResult] = useState<UploadResult | null>(null);
  const [imageResult, setImageResult] = useState<UploadResult | null>(null);
  const [metadataResult, setMetadataResult] = useState<UploadResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    task: "",
    framework: "PyTorch",
    version: "1.0.0",
    licenseRef: "",
  });

  function resetForNewFiles(kind: "model" | "image") {
    setMetadataResult(null);
    if (kind === "model") setModelResult(null);
    else setImageResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!connected || !publicKey) {
      toast.error("Connect a Solana wallet before creating the model manifest.");
      return;
    }
    if (!modelFile || !imageFile) {
      toast.error("Select both a ZIP model package and a cover image.");
      return;
    }
    setBusy(true);
    setMetadataResult(null);
    try {
      const model = modelResult ?? (await uploadFile(modelFile));
      setModelResult(model);
      const image = imageResult ?? (await uploadFile(imageFile));
      setImageResult(image);

      const manifest: ModelMetadata = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        image: image.ipfsUri,
        task: form.task.trim(),
        framework: form.framework,
        version: form.version.trim(),
        creatorWallet: publicKey.toBase58(),
        licenseRef: form.licenseRef.trim(),
        modelFile: { cid: model.cid, uri: model.ipfsUri },
      };
      const result = await uploadMetadata(manifest);
      setMetadataResult(result);
      toast.success("Model manifest uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The upload could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="workspace-page">
      <div className="workspace-shell publish-shell">
        <div className="page-heading-row">
          <div>
            <span className="eyebrow">CREATOR STUDIO</span>
            <h1>Publish an AI model</h1>
            <p>Upload a model package and cover image, then prepare its validated IPFS manifest.</p>
          </div>
          <span className="secure-note">
            <LockKeyhole size={14} /> Uploads go through your backend
          </span>
        </div>
        <IntegrationNotice compact />

        <div className="publish-layout">
          <form className="publish-form" onSubmit={handleSubmit}>
            <section className="form-panel">
              <div className="form-panel-head">
                <span className="form-index">01</span>
                <div>
                  <h2>Model details</h2>
                  <p>Help builders understand what your model is for.</p>
                </div>
              </div>
              <div className="form-grid">
                <label className="field full-field">
                  Model name <span className="required">*</span>
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="e.g. Coral Vision Classifier"
                  />
                </label>
                <label className="field">
                  Task <span className="required">*</span>
                  <input
                    required
                    maxLength={100}
                    value={form.task}
                    onChange={(event) => setForm({ ...form, task: event.target.value })}
                    placeholder="Image classification"
                  />
                </label>
                <label className="field">
                  Framework <span className="required">*</span>
                  <select
                    value={form.framework}
                    onChange={(event) => setForm({ ...form, framework: event.target.value })}
                  >
                    <option>PyTorch</option>
                    <option>TensorFlow</option>
                    <option>ONNX</option>
                    <option>JAX</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="field">
                  Version <span className="required">*</span>
                  <input
                    required
                    maxLength={50}
                    value={form.version}
                    onChange={(event) => setForm({ ...form, version: event.target.value })}
                    placeholder="1.0.0"
                  />
                </label>
                <label className="field full-field">
                  Description <span className="optional">Optional</span>
                  <textarea
                    maxLength={2000}
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="What does this model do? What data or use cases is it suited for?"
                  />
                </label>
                <label className="field full-field">
                  License reference <span className="required">*</span>
                  <input
                    type="url"
                    required
                    maxLength={2048}
                    value={form.licenseRef}
                    onChange={(event) => setForm({ ...form, licenseRef: event.target.value })}
                    placeholder="https://… or ipfs://…"
                  />
                  <small>
                    Provide the URL or IPFS URI for the model’s license. The backend validates it.
                  </small>
                </label>
              </div>
            </section>

            <section className="form-panel">
              <div className="form-panel-head">
                <span className="form-index">02</span>
                <div>
                  <h2>Model files</h2>
                  <p>The backend accepts ZIP packages and PNG, JPEG, or WEBP images.</p>
                </div>
              </div>
              <div className="upload-grid">
                <FileDrop
                  label="Model package"
                  icon={<FileArchive size={20} />}
                  accept=".zip,application/zip,application/x-zip-compressed"
                  file={modelFile}
                  result={modelResult}
                  onChange={(file) => {
                    setModelFile(file);
                    resetForNewFiles("model");
                  }}
                  onRemove={() => {
                    setModelFile(null);
                    resetForNewFiles("model");
                  }}
                  disabled={busy}
                />
                <FileDrop
                  label="Cover image"
                  icon={<FileImage size={20} />}
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  file={imageFile}
                  result={imageResult}
                  onChange={(file) => {
                    setImageFile(file);
                    resetForNewFiles("image");
                  }}
                  onRemove={() => {
                    setImageFile(null);
                    resetForNewFiles("image");
                  }}
                  disabled={busy}
                />
              </div>
            </section>

            <button
              className="button button-primary submit-button"
              type="submit"
              disabled={busy || !connected}
            >
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={17} /> Uploading package, image & manifest…
                </>
              ) : (
                <>
                  <CloudUpload size={17} /> Upload and prepare manifest
                </>
              )}
            </button>
            {!connected && (
              <p className="form-hint centered">
                Connect your wallet to attach the correct creator address to the metadata.
              </p>
            )}
          </form>

          <aside className="publish-aside">
            <div className="aside-panel preview-panel">
              <span className="eyebrow">MANIFEST STATUS</span>
              {metadataResult ? (
                <div className="ready-state">
                  <span className="ready-icon">
                    <Check size={22} />
                  </span>
                  <h3>Manifest ready</h3>
                  <p>Your metadata was accepted by the backend and uploaded to IPFS.</p>
                  <a
                    className="text-link"
                    href={metadataResult.gatewayUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open manifest <ExternalLink size={14} />
                  </a>
                  <code className="uri-code">{metadataResult.ipfsUri}</code>
                </div>
              ) : (
                <div className="waiting-state">
                  <div className="waiting-art">
                    <Sparkles size={20} />
                  </div>
                  <h3>Your model record will appear here</h3>
                  <p>
                    Upload both files and submit the details. Model, image, and metadata CIDs are
                    stored as separate values.
                  </p>
                  <div className="status-list">
                    <StatusRow label="Model ZIP" ready={Boolean(modelResult)} />
                    <StatusRow label="Cover image" ready={Boolean(imageResult)} />
                    <StatusRow label="Metadata manifest" ready={Boolean(metadataResult)} />
                  </div>
                </div>
              )}
            </div>
            <div className="aside-panel chain-panel">
              <span className="chain-lock">
                <LockKeyhole size={18} />
              </span>
              <div>
                <strong>NFT minting is not connected</strong>
                <p>
                  The matching Solana program IDL and a verified collection address are required.
                  Your uploaded manifest is retained above; no mint transaction is sent.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function FileDrop({
  label,
  icon,
  accept,
  file,
  result,
  onChange,
  onRemove,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  accept: string;
  file: File | null;
  result: UploadResult | null;
  onChange: (file: File) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div className="file-drop">
      <p className="file-drop-label">
        {label}
        <span className="required">*</span>
      </p>
      {!file ? (
        <label
          className="drop-target"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const droppedFile = event.dataTransfer.files[0];
            if (droppedFile) onChange(droppedFile);
          }}
        >
          <input
            type="file"
            accept={accept}
            onChange={(event) => {
              const next = event.target.files?.[0];
              if (next) onChange(next);
            }}
            disabled={disabled}
          />
          <span className="drop-icon">{icon}</span>
          <strong>Choose a file</strong>
          <small>or drag it here</small>
        </label>
      ) : (
        <div className="selected-file">
          <span className="drop-icon">{icon}</span>
          <div className="selected-file-info">
            <strong>{file.name}</strong>
            <small>
              {formatBytes(file.size)}
              {result ? ` · ${result.cid.slice(0, 14)}…` : ""}
            </small>
          </div>
          {result && <Check className="file-check" size={17} />}
          <button
            type="button"
            aria-label={`Remove ${file.name}`}
            className="remove-file"
            onClick={onRemove}
            disabled={disabled}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {result && (
        <a className="file-result-link" href={result.gatewayUrl} target="_blank" rel="noreferrer">
          Uploaded to IPFS <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

function StatusRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="status-row">
      <span className={ready ? "mini-check done" : "mini-check"}>
        {ready ? <Check size={12} /> : <span />}
      </span>
      <span>{label}</span>
      <span className={ready ? "status-complete" : "status-pending"}>
        {ready ? "Complete" : "Waiting"}
      </span>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
