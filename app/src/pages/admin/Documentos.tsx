import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDocumentoStore } from '@/store/documentoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter,
  Download,
  Trash2,
  CheckCircle,
  Folder,
  Eye,
  File,
  Calendar,
  User,
  Lock,
  Globe
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const tiposDocumento = [
  { value: 'reglamento', label: 'Reglamento' },
  { value: 'manual_convivencia', label: 'Manual de Convivencia' },
  { value: 'acta_asamblea', label: 'Acta de Asamblea' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'informe', label: 'Informe' },
  { value: 'otro', label: 'Otro' },
];

const categoriasDocumento = [
  { value: 'legal', label: 'Legal' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'financiero', label: 'Financiero' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'general', label: 'General' },
];

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function AdminDocumentos() {
  const { user } = useAuthStore();
  const { 
    documentos, 
    loading,
    error,
    fetchDocumentos, 
    createDocumento,
    deleteDocumento,
    aprobarDocumento,
    incrementarDescargas
  } = useDocumentoStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('todos');
  const [showNuevoDocumento, setShowNuevoDocumento] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [nuevoDocumento, setNuevoDocumento] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'reglamento',
    categoria: 'general',
    esPublico: false,
    requiereAprobacion: true,
    version: '',
    etiquetas: ''
  });
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchDocumentos(user.conjuntoId);
    }
  }, [user?.conjuntoId]);

  const filteredDocumentos = documentos.filter(d => {
    const matchesSearch = 
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.etiquetas?.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTipo = filterTipo === 'todos' || d.tipo === filterTipo;
    const matchesCategoria = filterCategoria === 'todos' || d.categoria === filterCategoria;
    return matchesSearch && matchesTipo && matchesCategoria;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') return;
      setArchivoSeleccionado(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setArchivoSeleccionado(file);
  };

  const handleSubirDocumento = async () => {
    if (!user?.conjuntoId || !archivoSeleccionado) return;
    
    await createDocumento(
      {
        conjuntoId: user.conjuntoId,
        nombre: nuevoDocumento.nombre,
        descripcion: nuevoDocumento.descripcion,
        tipo: nuevoDocumento.tipo as any,
        categoria: nuevoDocumento.categoria as any,
        esPublico: nuevoDocumento.esPublico,
        requiereAprobacion: nuevoDocumento.requiereAprobacion,
        version: nuevoDocumento.version,
        etiquetas: nuevoDocumento.etiquetas ? nuevoDocumento.etiquetas.split(',').map(e => e.trim()) : [],
        subidoPor: user.id,
        estado: nuevoDocumento.requiereAprobacion ? 'en_revision' : 'activo',
        archivoNombre: archivoSeleccionado.name,
        archivoTipo: archivoSeleccionado.type,
        archivoTamano: archivoSeleccionado.size,
        fechaSubida: new Date(),
        descargas: 0
      },
      archivoSeleccionado
    );
    
    setShowNuevoDocumento(false);
    setNuevoDocumento({
      nombre: '',
      descripcion: '',
      tipo: 'reglamento',
      categoria: 'general',
      esPublico: false,
      requiereAprobacion: true,
      version: '',
      etiquetas: ''
    });
    setArchivoSeleccionado(null);
    fetchDocumentos(user.conjuntoId);
  };

  const handleDescargar = (doc: any) => {
    incrementarDescargas(doc.id);
    window.open(doc.archivoUrl, '_blank');
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'reglamento': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'manual_convivencia': return <FileText className="h-5 w-5 text-green-500" />;
      case 'acta_asamblea': return <FileText className="h-5 w-5 text-purple-500" />;
      case 'certificado': return <CheckCircle className="h-5 w-5 text-yellow-500" />;
      case 'contrato': return <File className="h-5 w-5 text-orange-500" />;
      default: return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'activo') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Activo</Badge>;
    } else if (estado === 'en_revision') {
      return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" /> En Revisión</Badge>;
    } else {
      return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const documentosPorCategoria = documentos.reduce((acc: any, doc) => {
    acc[doc.categoria] = (acc[doc.categoria] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Documentos</h2>
          <p className="text-muted-foreground">
            Administra los documentos del conjunto residencial
          </p>
        </div>
        <Button onClick={() => setShowNuevoDocumento(true)} disabled={loading}>
          <Upload className="h-4 w-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando documentos...
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Públicos</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentos.filter(d => d.esPublico).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <Eye className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentos.filter(d => d.estado === 'en_revision').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Descargas</CardTitle>
            <Download className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentos.reduce((sum, d) => sum + (d.descargas || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categorías */}
      <div className="grid gap-4 md:grid-cols-5">
        {categoriasDocumento.map(cat => (
          <Card key={cat.value} className="cursor-pointer hover:bg-accent/50" onClick={() => setFilterCategoria(cat.value)}>
            <CardContent className="p-4 flex items-center gap-3">
              <Folder className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{cat.label}</p>
                <p className="text-sm text-muted-foreground">
                  {documentosPorCategoria[cat.value] || 0} documentos
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, descripción o etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposDocumento.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-[180px]">
            <Folder className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categorías</SelectItem>
            {categoriasDocumento.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documentos List */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos ({filteredDocumentos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDocumentos.map((doc) => (
              <div key={doc.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getTipoIcon(doc.tipo)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.nombre}</span>
                      {getEstadoBadge(doc.estado)}
                      {doc.esPublico ? (
                        <Badge variant="outline" className="bg-green-50"><Globe className="h-3 w-3 mr-1" /> Público</Badge>
                      ) : (
                        <Badge variant="outline"><Lock className="h-3 w-3 mr-1" /> Privado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{doc.descripcion}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Folder className="h-4 w-4" />
                        {doc.categoria}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(doc.fechaSubida)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {doc.descargas || 0} descargas
                      </span>
                      <span>{formatFileSize(doc.archivoTamano)}</span>
                    </div>
                    {doc.etiquetas && doc.etiquetas.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {doc.etiquetas.map((etiqueta, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{etiqueta}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.estado === 'en_revision' && (
                    <Button 
                      size="sm" 
                      onClick={() => user?.id && aprobarDocumento(doc.id, user.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDescargar(doc)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => deleteDocumento(doc.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {filteredDocumentos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron documentos con los filtros aplicados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nuevo Documento */}
      <Dialog open={showNuevoDocumento} onOpenChange={setShowNuevoDocumento}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subir Nuevo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Archivo PDF *</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-muted'}`}
              >
                <p className="text-sm">Arrastra aquí un PDF o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground">Solo archivos PDF</p>
              </div>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              {archivoSeleccionado && (
                <p className="text-sm text-muted-foreground">
                  {archivoSeleccionado.name} ({formatFileSize(archivoSeleccionado.size)})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input 
                placeholder="Nombre del documento"
                value={nuevoDocumento.nombre}
                onChange={(e) => setNuevoDocumento({...nuevoDocumento, nombre: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input 
                placeholder="Breve descripción del documento"
                value={nuevoDocumento.descripcion}
                onChange={(e) => setNuevoDocumento({...nuevoDocumento, descripcion: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={nuevoDocumento.tipo} 
                  onValueChange={(v) => setNuevoDocumento({...nuevoDocumento, tipo: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select 
                  value={nuevoDocumento.categoria} 
                  onValueChange={(v) => setNuevoDocumento({...nuevoDocumento, categoria: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasDocumento.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Versión</Label>
              <Input 
                placeholder="Ej: 1.0, 2024-01"
                value={nuevoDocumento.version}
                onChange={(e) => setNuevoDocumento({...nuevoDocumento, version: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Etiquetas (separadas por coma)</Label>
              <Input 
                placeholder="Ej: importante, legal, 2024"
                value={nuevoDocumento.etiquetas}
                onChange={(e) => setNuevoDocumento({...nuevoDocumento, etiquetas: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={nuevoDocumento.esPublico}
                  onChange={(e) => setNuevoDocumento({...nuevoDocumento, esPublico: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Documento público</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={nuevoDocumento.requiereAprobacion}
                  onChange={(e) => setNuevoDocumento({...nuevoDocumento, requiereAprobacion: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Requiere aprobación</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleSubirDocumento}
              disabled={!archivoSeleccionado || !nuevoDocumento.nombre || !nuevoDocumento.tipo || !nuevoDocumento.categoria}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}







