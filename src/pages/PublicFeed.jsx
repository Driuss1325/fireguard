import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "notistack";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";

// --- utils ---
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result);
      // quitamos el prefijo "data:image/...;base64,"
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Linkifica http/https/www./dominio/...
function Linkified({ text }) {
  if (!text) return null;
  const parts = String(text).split(
    /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]*)/g
  );
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        const looksLikeURL =
          p.startsWith("http://") ||
          p.startsWith("https://") ||
          p.startsWith("www.") ||
          /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(p);
        if (!looksLikeURL) return <span key={i}>{p}</span>;
        const href = p.startsWith("http") ? p : `https://${p}`;
        return (
          <Link key={i} href={href} target="_blank" rel="noopener noreferrer">
            {p}
          </Link>
        );
      })}
    </>
  );
}

export default function PublicFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [postImg, setPostImg] = useState(null); // base64 sin prefijo
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // comentarios locales por postId
  const [commentText, setCommentText] = useState({});
  const [commentImg, setCommentImg] = useState({}); // { [postId]: base64 }

  const load = async () => {
    const { data } = await api.get("/api/community/public");
    setItems(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onPickPostImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      enqueueSnackbar("Imagen > 5MB", { variant: "warning" });
      return;
    }
    const b64 = await fileToBase64(f);
    setPostImg(b64);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !postImg) {
      enqueueSnackbar("Escribe un mensaje o adjunta una imagen", {
        variant: "warning",
      });
      return;
    }
    setLoading(true);
    try {
      const authorName = user?.name || user?.email || "ANONIMO";
      await api.post("/api/community/public", {
        authorName,
        content: text.trim(),
        imageBase64: postImg || undefined,
      });
      setText("");
      setPostImg(null);
      await load();
      enqueueSnackbar("Reporte publicado", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.message || e?.response?.data?.error || e.message,
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  const onPickCommentImage = async (postId, e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      enqueueSnackbar("Imagen > 5MB", { variant: "warning" });
      return;
    }
    const b64 = await fileToBase64(f);
    setCommentImg((prev) => ({ ...prev, [postId]: b64 }));
  };

  const submitComment = async (postId) => {
    const bodyText = commentText[postId]?.trim() || "";
    const img = commentImg[postId];
    if (!bodyText && !img) {
      enqueueSnackbar("Comentario vacío", { variant: "warning" });
      return;
    }
    try {
      const authorName = user?.name || user?.email || "ANONIMO";
      await api.post(`/api/community/${postId}/comments`, {
        authorName,
        content: bodyText,
        imageBase64: img || undefined,
      });
      // reset campos
      setCommentText((p) => ({ ...p, [postId]: "" }));
      setCommentImg((p) => ({ ...p, [postId]: undefined }));
      await load();
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.message || e?.response?.data?.error || e.message,
        { variant: "error" }
      );
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Crear Post */}
      <Paper sx={{ p: 2, mb: 2 }} component="form" onSubmit={submit}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Comunidad (público)
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            fullWidth
            placeholder="Reporta un incendio/anomalía..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            hidden
            accept="image/*"
            id="post-img"
            type="file"
            onChange={onPickPostImage}
          />
          <label htmlFor="post-img">
            <IconButton component="span" title="Adjuntar imagen">
              <ImageIcon />
            </IconButton>
          </label>
          {postImg && (
            <IconButton
              color="error"
              title="Quitar imagen"
              onClick={() => setPostImg(null)}
            >
              <DeleteIcon />
            </IconButton>
          )}
          <Button variant="contained" type="submit" disabled={loading}>
            Enviar
          </Button>
        </Stack>

        {/* Vista previa del post */}
        {postImg && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Vista previa:
            </Typography>
            <Box
              component="img"
              alt="preview"
              loading="lazy"
              src={`data:image/*;base64,${postImg}`}
              sx={{
                display: "block",
                maxWidth: { xs: "100%", sm: 520 },
                maxHeight: 360,
                width: "100%",
                height: "auto",
                objectFit: "contain",
                mx: "auto",
                my: 1,
                borderRadius: 1,
                boxShadow: 1,
                backgroundColor: "background.paper",
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Listado */}
      <Stack spacing={2}>
        {items.map((p) => (
          <Paper key={p.id} sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar>{(p.authorName || "A").charAt(0).toUpperCase()}</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {p.authorName === "ANONIMO" ? (
                    <span style={{ color: "#94a3b8" }}>(anónimo)</span>
                  ) : (
                    p.authorName
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(p.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: 1 }}>
              <Typography variant="body1">
                <Linkified text={p.content} />
              </Typography>

              {/* Imagen del post (centrada, responsiva, mantiene aspecto) */}
              {p.imageBase64 && (
                <Box
                  component="img"
                  alt="post"
                  loading="lazy"
                  src={`data:image/*;base64,${p.imageBase64}`}
                  sx={{
                    display: "block",
                    maxWidth: { xs: "100%", sm: 520 },
                    maxHeight: 360,
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    mx: "auto",
                    my: 1,
                    borderRadius: 1,
                    boxShadow: 1,
                    backgroundColor: "background.paper",
                  }}
                />
              )}
            </Box>

            {/* Comentarios */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Comentarios
            </Typography>

            <Stack spacing={1} sx={{ mb: 2 }}>
              {(p.comments || []).map((c) => (
                <Box key={c.id} sx={{ pl: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {c.authorName === "ANONIMO" ? "(anónimo)" : c.authorName}{" "}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                    >
                      • {new Date(c.createdAt).toLocaleString()}
                    </Typography>
                  </Typography>
                  <Typography variant="body2">
                    <Linkified text={c.content} />
                  </Typography>
                  {c.imageBase64 && (
                    <Box
                      component="img"
                      alt="comment"
                      loading="lazy"
                      src={`data:image/*;base64,${c.imageBase64}`}
                      sx={{
                        display: "block",
                        maxWidth: { xs: "100%", sm: 520 },
                        maxHeight: 360,
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                        mx: "auto",
                        my: 1,
                        borderRadius: 1,
                        boxShadow: 1,
                        backgroundColor: "background.paper",
                      }}
                    />
                  )}
                </Box>
              ))}
            </Stack>

            {/* Nuevo comentario */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Escribe un comentario… (links serán clicables)"
                value={commentText[p.id] || ""}
                onChange={(e) =>
                  setCommentText((prev) => ({ ...prev, [p.id]: e.target.value }))
                }
              />
              <input
                hidden
                accept="image/*"
                id={`c-img-${p.id}`}
                type="file"
                onChange={(e) => onPickCommentImage(p.id, e)}
              />
              <label htmlFor={`c-img-${p.id}`}>
                <IconButton component="span" title="Adjuntar imagen">
                  <ImageIcon fontSize="small" />
                </IconButton>
              </label>
              {commentImg[p.id] && (
                <IconButton
                  color="error"
                  title="Quitar imagen"
                  onClick={() =>
                    setCommentImg((prev) => ({ ...prev, [p.id]: undefined }))
                  }
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
              <Button variant="outlined" onClick={() => submitComment(p.id)}>
                Comentar
              </Button>
            </Stack>

            {/* Vista previa de imagen del comentario */}
            {commentImg[p.id] && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Vista previa imagen comentario:
                </Typography>
                <Box
                  component="img"
                  alt="preview comment"
                  loading="lazy"
                  src={`data:image/*;base64,${commentImg[p.id]}`}
                  sx={{
                    display: "block",
                    maxWidth: { xs: "100%", sm: 520 },
                    maxHeight: 360,
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    mx: "auto",
                    my: 1,
                    borderRadius: 1,
                    boxShadow: 1,
                    backgroundColor: "background.paper",
                  }}
                />
              </Box>
            )}
          </Paper>
        ))}
      </Stack>

      <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
        <Button size="large" variant="outlined" href="/login">
          Ir al panel (Login)
        </Button>
      </Stack>
    </Container>
  );
}
