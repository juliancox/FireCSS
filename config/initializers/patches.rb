
require 'zip/zip'
require 'zip/zipfilesystem'

module Zip
  class ZipFile < ZipCentralDirectory
    def initialize(fileName, create = nil)
      super()
      @name = fileName
      @comment = ""
      if (fileName.is_a?(TMail::Attachment))
        read_from_stream(fileName)
      elsif (File.exists?(fileName))
        File.open(name, "rb") { |f| read_from_stream(f) }
      elsif (create)
        @entrySet = ZipEntrySet.new
      else
        raise ZipError, "File #{fileName} not found"
      end
      @create = create
      @storedEntries = @entrySet.dup

      @restore_ownership = false
      @restore_permissions = false
      @restore_times = true
    end
  end
end

module Zip
  class ZipInputStream

    def initialize(filename, offset = 0, is_file = true)
      super()
      if (is_file)
        @archiveIO = File.open(filename, "rb")
      else
        @archiveIO = filename
      end
      @archiveIO.seek(offset, IO::SEEK_SET)
      @decompressor = NullDecompressor.instance
      @currentEntry = nil
    end

    def ZipInputStream.use(contents)
      return new(contents, 0, false) unless block_given?

      zio = new(contents, 0, false)
      yield zio
    ensure
      zio.close if zio
    end

  end
end

module Zip
  class ZipOutputStream

    def initialize(fileName, stream = nil)
      super()
      @fileName = fileName
      @outputStream = stream ? stream : File.new(@fileName, "wb")
      @entrySet = ZipEntrySet.new
      @compressor = NullCompressor.instance
      @closed = false
      @currentEntry = nil
      @comment = nil
    end

    def ZipOutputStream.use(fileName, stream)
      return new(fileName, stream) unless block_given?
      zos = new(fileName, stream)
      yield zos
    ensure
      zos.close if zos
    end


  end
end
